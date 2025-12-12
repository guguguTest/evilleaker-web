// src/stores/messageBadge.js
import { defineStore } from 'pinia'
import request from '@/api/index'
import { useAuthStore } from '@/stores/auth'

export const useMessageBadgeStore = defineStore('messageBadge', {
  state: () => ({
    totalUnread: 0,          // 顶部总数（仅统计好友/私信）
    perFriendUnread: {},     // { [friendId]: count }
    _timer: null,
    _pollIntervalMs: 15000,
    _isRefreshing: false,
  }),

  getters: {
    getFriendUnread: (state) => (friendId) =>
      state.perFriendUnread[String(friendId)] || 0,
  },

  actions: {
    _setAll(payload) {
      const { totalUnread, perFriendUnread } = payload || {}
      this.totalUnread = Number(totalUnread) || 0
      this.perFriendUnread = perFriendUnread || {}
    },

    async _fetchUnreadMapByPaging(maxPages = 4, pageSize = 200) {
      const auth = useAuthStore()
      const myId = auth?.user?.id || auth?.userId || 0

      const per = {}
      for (let page = 1; page <= maxPages; page += 1) {
        const res = await request.get('/api/messages', { params: { page, limit: pageSize } })
        // 兼容后端返回：数组 | { items } | { data } | { messages }
        const rows = Array.isArray(res) ? res : (res?.items || res?.data || res?.messages || [])
        if (!rows || rows.length === 0) break

        for (const r of rows) {
          // 仅统计好友消息（来自用户的私信）且未读
          const typeOK = r.message_type === 'user' || r.type === 'user'
          // 确保正确判断消息是否未读：已读条件为 is_read 为 true/1/'1' 或 read_at 不为 null 且不为空字符串
          const isRead = r.is_read === true || r.is_read === 1 || r.is_read === '1' || (r.read_at != null && r.read_at !== '')
          const unread = !isRead
          const fromOther = myId ? (String(r.sender_id) !== String(myId)) : true
          if (typeOK && unread && fromOther) {
            const key = String(r.sender_id)
            per[key] = (per[key] || 0) + 1
          }
        }
        if (rows.length < pageSize) break
      }
      const totalUnread = Object.values(per).reduce((a, b) => a + b, 0)
      return { totalUnread, perFriendUnread: per }
    },

    async refresh() {
      if (this._isRefreshing) return
      this._isRefreshing = true
      try {
        const data = await this._fetchUnreadMapByPaging()
        this._setAll(data)
      } finally {
        this._isRefreshing = false
      }
    },

    init() {
      if (this._timer) return
      this.refresh() // 立即拉一次

      const tick = async () => { try { await this.refresh() } catch (e) { /* 忽略单次失败 */ } }
      this._timer = window.setInterval(tick, this._pollIntervalMs)

      const vis = () => { if (document.visibilityState === 'visible') this.refresh() }
      document.addEventListener('visibilitychange', vis)
      window.addEventListener('focus', vis)
    },

    stop() {
      if (this._timer) { clearInterval(this._timer); this._timer = null }
    },

    // 进入好友聊天时调用：前端乐观清零 + 调后端标记为已读，然后 refresh 对齐
    async markFriendAsRead(friendId) {
      if (!friendId) return
      const key = String(friendId)

      // 乐观更新（立即消除徽章并扣减总数）
      const prev = { totalUnread: this.totalUnread, perFriendUnread: { ...this.perFriendUnread } }
      const old = this.perFriendUnread[key] || 0
      if (old > 0) {
        const nextPer = { ...this.perFriendUnread, [key]: 0 }
        const nextTotal = Object.values(nextPer).reduce((a, b) => a + b, 0)
        this._setAll({ totalUnread: nextTotal, perFriendUnread: nextPer })
      }

      try {
        await request.get(`/api/messages/conversation/${friendId}`)
      } catch (e) {
        // 失败则回滚
        this._setAll(prev)
        throw e
      } finally {
        this.refresh()
      }
    },
  },
})
