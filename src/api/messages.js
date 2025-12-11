// src/stores/messageBadge.js
import { defineStore } from 'pinia';
import request from '@/api/index';

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
        _setAll({ totalUnread, perFriendUnread }) {
            this.totalUnread = totalUnread;
            this.perFriendUnread = perFriendUnread;
        },

        async _fetchUnreadMapByPaging(maxPages = 4, pageSize = 500) {
            const per = {};
            for (let page = 1; page <= maxPages; page += 1) {
                // 使用你现有 axios 实例，请求后端 /api/messages
                const res = await request.get('/api/messages', { params: { page, limit: pageSize } });
                const rows = Array.isArray(res) ? res : (res?.items || res?.data || []);
                if (!rows || rows.length === 0) break;

                for (const r of rows) {
                    const unread = r.is_read === false || r.is_read === 0 || r.is_read === '0';
                    if (r.message_type === 'user' && unread) {
                        const k = String(r.sender_id);
                        per[k] = (per[k] || 0) + 1;
                    }
                }
                if (rows.length < pageSize) break;
            }
            const totalUnread = Object.values(per).reduce((a, b) => a + b, 0);
            return { totalUnread, perFriendUnread: per };
        },

        async refresh() {
            if (this._isRefreshing) return;
            this._isRefreshing = true;
            try {
                const data = await this._fetchUnreadMapByPaging();
                this._setAll(data);
            } finally {
                this._isRefreshing = false;
            }
        },

        init() {
            if (this._timer) return;      // 避免重复
            this.refresh();                // 立即拉一次

            const tick = async () => { try { await this.refresh(); } catch {} };
            this._timer = window.setInterval(tick, this._pollIntervalMs);

            const vis = () => { if (document.visibilityState === 'visible') this.refresh(); };
            document.addEventListener('visibilitychange', vis);
            window.addEventListener('focus', vis);
        },

        stop() {
            if (this._timer) { clearInterval(this._timer); this._timer = null; }
        },

        // 进入好友聊天页时调用：前端乐观清零 + 后端会话接口标记已读，然后再 refresh 同步
        async markFriendAsRead(friendId) {
            const key = String(friendId);
            const prev = { totalUnread: this.totalUnread, perFriendUnread: { ...this.perFriendUnread } };

            const old = this.perFriendUnread[key] || 0;
            if (old > 0) {
                const nextPer = { ...this.perFriendUnread, [key]: 0 };
                const nextTotal = Object.values(nextPer).reduce((a, b) => a + b, 0);
                this._setAll({ totalUnread: nextTotal, perFriendUnread: nextPer });
            }

            try {
                await request.get(`/api/messages/conversation/${friendId}`);
            } catch (e) {
                this._setAll(prev); // 失败回滚
                throw e;
            } finally {
                this.refresh(); // 再拉一次，和服务器完全对齐
            }
        },
    },
});
