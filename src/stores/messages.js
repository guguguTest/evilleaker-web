// src/stores/messages.js
import { defineStore } from 'pinia'
import { ref } from 'vue'
import axios from 'axios'

export const useMessageStore = defineStore('messages', () => {
    // 会话相关
    const conversationUser = ref(null)
    const conversation = ref([])                // ⚠️ 必须初始化为空数组
    const loadingConversation = ref(false)

    // 下拉/未读
    const unreadCount = ref(0)
    const recentMessages = ref([])

    // —— 工具：保证数组 —— //
    function ensureArray() {
        if (!Array.isArray(conversation.value)) conversation.value = []
    }

    // —— 刷新未读与最近消息（根据你现有后端接口名改一下即可）—— //
    async function refreshUnreadCount() {
        try {
            const { data } = await axios.get('/api/messages/unread-count')
            unreadCount.value = Number(data?.count || 0)
        } catch (_) {
            unreadCount.value = 0
        }
    }

    async function refreshRecentMessages() {
        try {
            const { data } = await axios.get('/api/messages/recent')
            recentMessages.value = Array.isArray(data) ? data : (data?.items || [])
        } catch (_) {
            recentMessages.value = []
        }
    }

    // —— 打开会话并拉历史 —— //
    async function openConversationWithUser(user) {
        conversationUser.value = user
        loadingConversation.value = true
        conversation.value = [] // 重置为数组，避免 not iterable

        try {
            // 你原来的历史接口是什么就用什么；下面是示例
            // 返回数组：[{ id, content, is_sent, created_at }, ...]
            const { data } = await axios.get('/api/messages/history', {
                params: { userId: user.id },
            })
            conversation.value = Array.isArray(data) ? data : (data?.items || [])
        } catch (e) {
            conversation.value = []
        } finally {
            loadingConversation.value = false
        }
    }

    // —— 发送消息 —— //
    function appendConversationMessage(localMsg) {
        ensureArray()
        conversation.value = [...conversation.value, localMsg]
    }

    async function sendChatMessage(text) {
        if (!conversationUser.value) return
        const payload = {
            toUserId: conversationUser.value.id,
            content: text,
        }

        // 先本地插一条，提升手感（失败再回滚）
        const tempId = 'temp_' + Date.now()
        const localMsg = {
            id: tempId,
            is_sent: true,
            content: text,
            created_at: new Date().toISOString(),
        }
        appendConversationMessage(localMsg)

        try {
            const { data } = await axios.post('/api/messages/send', payload)
            const serverMsg = data?.message || {
                id: data?.id,
                is_sent: true,
                content: text,
                created_at: data?.created_at || new Date().toISOString(),
            }

            // 用后端返回的 id/时间替换本地临时消息
            ensureArray()
            const idx = conversation.value.findIndex((m) => m.id === tempId)
            if (idx !== -1) {
                conversation.value.splice(idx, 1, serverMsg)
            }
            // 未读/最近消息可以顺便刷新
            refreshUnreadCount().catch(() => {})
            refreshRecentMessages().catch(() => {})
        } catch (e) {
            // 发送失败：回滚本地临时消息
            ensureArray()
            const idx = conversation.value.findIndex((m) => m.id === tempId)
            if (idx !== -1) conversation.value.splice(idx, 1)
            throw e
        }
    }

    // —— 标记已读（供下拉用）—— //
    async function markAsRead(messageId) {
        try {
            await axios.post('/api/messages/mark-read', { id: messageId })
            // 本地同步
            const msg = (recentMessages.value || []).find((m) => m.id === messageId)
            if (msg) msg.is_read = true
            refreshUnreadCount().catch(() => {})
        } catch (_) {}
    }

    return {
        // state
        conversationUser,
        conversation,
        loadingConversation,
        unreadCount,
        recentMessages,

        // actions
        refreshUnreadCount,
        refreshRecentMessages,
        openConversationWithUser,
        sendChatMessage,
        markAsRead,
    }
})
