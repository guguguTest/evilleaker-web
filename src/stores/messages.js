// src/stores/messages.js
import {defineStore} from 'pinia';
import {ref} from 'vue';
import {
    getUnreadCount,
    getRecentMessages,
    getMessageList,
    markMessageRead,
    deleteMessage,
    batchDeleteMessages,
    getConversation,
    sendMessage,
} from '@/api/message';

export const useMessageStore = defineStore('messages', () => {
    const unreadCount = ref(0);
    const recent = ref([]);          // 下拉用最近消息
    const list = ref([]);            // 消息中心当前页
    const listPage = ref(1);
    const listLimit = ref(20);
    const listHasMore = ref(true);
    const loadingDropdown = ref(false);
    const loadingList = ref(false);
    const loadingConversation = ref(false);
    const conversation = ref([]);    // 当前聊天记录
    const conversationUser = ref(null); // 正在聊天的用户对象 { id, nickname, avatar ... }

    function setUnreadCount(val) {
        unreadCount.value = val;
    }

    function setRecentMessages(val) {
        recent.value = val || [];
    }

    function resetList() {
        list.value = [];
        listPage.value = 1;
        listHasMore.value = true;
    }

    function appendListItems(items) {
        if (!items || items.length === 0) {
            listHasMore.value = false;
            return;
        }
        list.value = [...list.value, ...items];
        if (items.length < listLimit.value) {
            listHasMore.value = false;
        }
    }

    function setConversationUser(user) {
        conversationUser.value = user;
    }

    function setConversationMessages(msgs) {
        conversation.value = msgs || [];
    }

    function appendConversationMessage(msg) {
        conversation.value = [...conversation.value, msg];
    }

    async function refreshUnreadCount() {
        const res = await getUnreadCount();
        setUnreadCount(res.count || 0);
    }

    async function refreshRecentMessages() {
        loadingDropdown.value = true;
        try {
            const res = await getRecentMessages();
            setRecentMessages(res);
        } finally {
            loadingDropdown.value = false;
        }
    }

    async function loadMessageList(reset = false) {
        if (loadingList.value) return;
        if (reset) {
            resetList();
        }
        if (!listHasMore.value && !reset) return;

        loadingList.value = true;
        try {
            const res = await getMessageList({
                page: listPage.value,
                limit: listLimit.value,
            });
            appendListItems(res);
            listPage.value += 1;
        } finally {
            loadingList.value = false;
        }
    }

    async function markAsRead(id) {
        await markMessageRead(id);
        // 下拉 + 列表 + 未读数 同步
        unreadCount.value = Math.max(0, unreadCount.value - 1);
        recent.value = recent.value.map(m =>
            m.id === id ? {...m, is_read: 1} : m,
        );
        list.value = list.value.map(m =>
            m.id === id ? {...m, is_read: 1} : m,
        );
    }

    async function deleteOne(id) {
        await deleteMessage(id);
        list.value = list.value.filter(m => m.id !== id);
        recent.value = recent.value.filter(m => m.id !== id);
    }

    async function batchDelete(ids) {
        if (!ids || !ids.length) return;
        await batchDeleteMessages(ids);
        list.value = list.value.filter(m => !ids.includes(m.id));
        recent.value = recent.value.filter(m => !ids.includes(m.id));
    }

    async function openConversationWithUser(user) {
        if (!user || !user.id) return;
        loadingConversation.value = true;
        try {
            setConversationUser(user);
            const res = await getConversation(user.id);
            setConversationMessages(res);
        } finally {
            loadingConversation.value = false;
        }
    }

    async function sendChatMessage(content) {
        if (!conversationUser.value) return;
        const res = await sendMessage({
            recipient_id: conversationUser.value.id,
            content,
            message_type: 'user',
        });
        // 后端返回的格式你可以按实际调整
        appendConversationMessage({
            id: res.id,
            content: res.content,
            created_at: res.created_at,
            is_sent: true,
            is_read: false,
        });
    }

    return {
        unreadCount,
        recent,
        list,
        listPage,
        listLimit,
        listHasMore,
        loadingDropdown,
        loadingList,
        loadingConversation,
        conversation,
        conversationUser,

        setUnreadCount,
        setRecentMessages,
        resetList,
        appendListItems,
        setConversationUser,
        setConversationMessages,
        appendConversationMessage,

        refreshUnreadCount,
        refreshRecentMessages,
        loadMessageList,
        markAsRead,
        deleteOne,
        batchDelete,
        openConversationWithUser,
        sendChatMessage,
    };
});
