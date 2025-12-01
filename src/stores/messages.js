// src/stores/messages.js
import { defineStore } from 'pinia';
import { ref } from 'vue';
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
} from '@/api/message';
import { useAuthStore } from '@/stores/auth';

function toArray(v) {
    if (!v) return [];
    return Array.isArray(v) ? v : [v];
}

export const useMessageStore = defineStore('messages', () => {
    // ====== 会话相关（聊天窗口） ======
    const conversationUser = ref(null);      // 当前聊天对象（好友）
    const conversation = ref([]);            // 当前会话消息列表
    const loadingConversation = ref(false);

    // ====== 顶部图标 & 下拉 ======
    const unreadCount = ref(0);
    const recentMessages = ref([]);

    // ====== 消息中心列表 ======
    const list = ref([]);
    const listPage = ref(1);
    const listPageSize = ref(20);
    const listHasMore = ref(true);
    const listLoading = ref(false);

    // -------- 未读 & 最近 --------
    async function refreshUnreadCount() {
        try {
            const res = await getUnreadCount();
            unreadCount.value = Number(res.data?.count || 0);
        } catch (e) {
            console.error('refreshUnreadCount error', e);
        }
    }

    async function refreshRecentMessages() {
        try {
            const res = await getRecentMessages();
            recentMessages.value = toArray(res.data);
        } catch (e) {
            console.error('refreshRecentMessages error', e);
        }
    }

    // -------- 消息中心列表 --------
    async function loadMessageList(reset = false) {
        if (listLoading.value) return;
        listLoading.value = true;
        try {
            const page = reset ? 1 : listPage.value;
            const res = await getMessageList({
                page,
                limit: listPageSize.value,
            });
            const items = Array.isArray(res.data) ? res.data : [];
            if (reset) {
                list.value = items;
            } else {
                list.value = list.value.concat(items);
            }
            listPage.value = page + 1;
            listHasMore.value = items.length >= listPageSize.value;
        } catch (e) {
            console.error('loadMessageList error', e);
        } finally {
            listLoading.value = false;
        }
    }

    async function markAsRead(id) {
        try {
            await markMessageRead(id);
            list.value = list.value.map((m) =>
                m.id === id ? { ...m, is_read: 1 } : m,
            );
            if (unreadCount.value > 0) unreadCount.value -= 1;
        } catch (e) {
            console.error('markAsRead error', e);
        }
    }

    async function markAllAsRead() {
        try {
            await markAllMessagesRead();
            list.value = list.value.map((m) => ({ ...m, is_read: 1 }));
            unreadCount.value = 0;
        } catch (e) {
            console.error('markAllAsRead error', e);
        }
    }

    async function batchDelete(ids) {
        const idArr = toArray(ids).map((x) => Number(x));
        if (!idArr.length) return;
        try {
            await batchDeleteMessages(idArr);
            list.value = list.value.filter((m) => !idArr.includes(m.id));
        } catch (e) {
            console.error('batchDelete error', e);
        }
    }

    async function deleteOne(id) {
        try {
            await deleteMessage(id);
            list.value = list.value.filter((m) => m.id !== id);
        } catch (e) {
            console.error('deleteOne error', e);
        }
    }

    // -------- 会话（聊天窗口） --------
    async function openConversationWithUser(user) {
        if (!user || !user.id) return;
        conversationUser.value = user;
        loadingConversation.value = true;
        conversation.value = [];
        try {
            const res = await getConversation(user.id);
            const data = res.data || {};
            const msgs = Array.isArray(data.messages) ? data.messages : [];
            conversation.value = msgs;
        } catch (e) {
            console.error('openConversationWithUser error', e);
            conversation.value = [];
        } finally {
            loadingConversation.value = false;
        }
    }

    /**
     * 发送聊天消息
     * @param {string} rawContent 文本 / emoji 特殊串
     * @returns {Promise<void>}
     */
    async function sendChatMessage(rawContent) {
        const user = conversationUser.value;
        if (!user || !user.id) {
            console.warn('sendChatMessage: no conversation user');
            return;
        }
        const content = String(rawContent ?? '').trim();
        if (!content) return;

        const authStore = useAuthStore();
        const me = authStore.user || {};
        const senderId = me.id;

        const tempId = Date.now();
        const nowIso = new Date().toISOString();

        // 本地先插一条，提升体验
        const tempMsg = {
            id: tempId,
            sender_id: senderId,
            content,
            created_at: nowIso,
            message_type: 'user',
            is_sent: true,
            is_read: false,
        };
        conversation.value = [...conversation.value, tempMsg];

        try {
            const res = await sendMessage({
                recipient_id: user.id,
                content,
            });
            const realId = res.data?.message_id;
            if (realId) {
                tempMsg.id = realId;
            }
        } catch (e) {
            console.error('sendChatMessage error', e);
            tempMsg.send_error = true; // 方便前端加个红色提示
            throw e;
        }
    }

    return {
        // state
        conversationUser,
        conversation,
        loadingConversation,
        unreadCount,
        recentMessages,
        list,
        listPage,
        listPageSize,
        listHasMore,
        listLoading,

        // 顶部图标 & 下拉
        refreshUnreadCount,
        refreshRecentMessages,

        // 消息中心
        loadMessageList,
        markAsRead,
        markAllAsRead,
        batchDelete,
        deleteOne,

        // 聊天窗口
        openConversationWithUser,
        sendChatMessage,
    };
});
