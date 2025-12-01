// src/stores/messages.js
import { defineStore } from 'pinia'
import { ref } from 'vue'
import {
    getUnreadCount,
    getRecentMessages,
    getMessageList,
    markMessageRead,
    markAllMessagesRead,
    deleteMessage,
    batchDeleteMessages,
    getConversation,
    sendMessage,
} from '@/api/message'
import { useAuthStore } from '@/stores/auth'

// 判定是否表情消息（严格不用 v-html）
function isEmojiPayload (text) {
    return typeof text === 'string' && text.startsWith('[emoji:') && text.endsWith(']')
}

export const useMessageStore = defineStore('messages', () => {
    // 顶栏/下拉
    const unread = ref(0)
    const recent = ref([])

    // 消息中心
    const listLoading = ref(false)
    const list = ref([])

    // 聊天会话
    const conversationUser = ref(null) // { id, username, nickname, avatar, uid }
    const loadingConversation = ref(false)
    const conversation = ref([])       // [{ id, sender_id, content, created_at, message_type, is_sent, is_read }]

    // ---------- 顶栏/下拉 ----------
    async function refreshUnread () {
        try {
            const res = await getUnreadCount()
            unread.value = Number(res?.count ?? 0)
        } catch (e) {
            console.error('getUnreadCount error', e)
        }
    }

    async function refreshRecentMessages () {
        try {
            const res = await getRecentMessages()
            recent.value = Array.isArray(res) ? res : []
        } catch (e) {
            console.error('getRecentMessages error', e)
            recent.value = []
        }
    }

    // ---------- 消息中心 ----------
    async function loadMessageList () {
        listLoading.value = true
        try {
            const res = await getMessageList()
            list.value = Array.isArray(res) ? res : []
        } catch (e) {
            console.error('getMessageList error', e)
            list.value = []
        } finally {
            listLoading.value = false
        }
    }

    async function markAsRead (id) {
        try {
            await markMessageRead(id)
            // 前端同步已读
            const item = list.value.find(m => m.id === id)
            if (item) item.is_read = true
            // 顶栏角标刷新
            refreshUnread().catch(() => {})
        } catch (e) {
            console.error('markMessageRead error', e)
        }
    }

    async function markAllAsRead () {
        try {
            await markAllMessagesRead()
            list.value.forEach(m => { m.is_read = true })
            refreshUnread().catch(() => {})
        } catch (e) {
            console.error('markAllMessagesRead error', e)
        }
    }

    async function deleteOne (id) {
        try {
            await deleteMessage(id)
            const idx = list.value.findIndex(m => m.id === id)
            if (idx >= 0) list.value.splice(idx, 1)
        } catch (e) {
            console.error('deleteMessage error', e)
        }
    }

    async function batchDeleteSelected (ids = []) {
        if (!ids.length) return
        try {
            await batchDeleteMessages(ids)
            const set = new Set(ids)
            list.value = list.value.filter(m => !set.has(m.id))
        } catch (e) {
            console.error('batchDeleteMessages error', e)
        }
    }

    // ---------- 聊天会话 ----------
    async function openConversationWithUser (user) {
        if (!user || !user.id) return
        conversationUser.value = user
        loadingConversation.value = true
        try {
            const res = await getConversation(user.id)
            // 后端返回可能是 { messages, otherUserOnline, otherUserId }
            const data = res?.messages ? res : (res?.data ?? {})
            const msgs = Array.isArray(data.messages) ? data.messages : (Array.isArray(res) ? res : [])
            conversation.value = Array.isArray(msgs) ? msgs : []
        } catch (e) {
            console.error('openConversationWithUser error', e)
            conversation.value = []
        } finally {
            loadingConversation.value = false
        }
    }

    /**
     * 发送聊天消息（文本或表情串）
     * - rawContent: string（安全文本 / “[emoji:{...}]”）
     * - 后端会校验 message_type，未识别类型会回退到 'user'（我们这里也按该约定）
     */
    async function sendChatMessage (rawContent) {
        const user = conversationUser.value
        if (!user || !user.id) return
        const content = String(rawContent ?? '').trim()
        if (!content) return

        const auth = useAuthStore()
        const meId = auth?.user?.id

        // 本地临时追加（“发送中”）
        const tempId = `tmp_${Date.now()}_${Math.random().toString(36).slice(2)}`
        const tempMsg = {
            id: tempId,
            sender_id: meId,
            content,
            message_type: isEmojiPayload(content) ? 'emoji' : 'user',
            created_at: new Date().toISOString(),
            is_sent: true,
            is_read: false,
        }
        conversation.value.push(tempMsg)

        try {
            await sendMessage({
                recipient_id: user.id,
                content,
                message_type: isEmojiPayload(content) ? 'emoji' : 'user',
            })
            // 成功：保持 UI 一致（后续轮询/重新打开会话时会用真实 ID 覆盖）
        } catch (e) {
            console.error('sendMessage error', e)
            // 失败：给一个失败提示状态
            tempMsg._sendFailed = true
        }
    }

    return {
        // state
        unread, recent,
        listLoading, list,
        conversationUser, loadingConversation, conversation,
        // actions
        refreshUnread, refreshRecentMessages,
        loadMessageList, markAsRead, markAllAsRead, deleteOne, batchDeleteSelected,
        openConversationWithUser, sendChatMessage,
    }
})
