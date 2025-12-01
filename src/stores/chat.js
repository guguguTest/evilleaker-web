// src/stores/chat.js
import { defineStore } from 'pinia';
import { ref } from 'vue';
import { useMessageStore } from '@/stores/messages';

export const useChatStore = defineStore('chat', () => {
    // 是否显示聊天窗口
    const visible = ref(false);

    // 下面这些是旧代码里用到的位置 / 尺寸字段
    // 为了兼容其他地方的调用，保留但不强依赖
    const left = ref(80);
    const top = ref(80);
    const width = ref(520);
    const height = ref(640);
    const isDragging = ref(false);
    const isResizing = ref(false);

    async function openChatWithUser(user) {
        const messageStore = useMessageStore();
        visible.value = true;
        await messageStore.openConversationWithUser(user);
    }

    function close() {
        visible.value = false;
    }

    function setPosition(x, y) {
        left.value = x;
        top.value = y;
    }

    function setSize(w, h) {
        width.value = w;
        height.value = h;
    }

    function setDragging(flag) {
        isDragging.value = !!flag;
    }

    function setResizing(flag) {
        isResizing.value = !!flag;
    }

    return {
        visible,
        left,
        top,
        width,
        height,
        isDragging,
        isResizing,
        openChatWithUser,
        close,
        setPosition,
        setSize,
        setDragging,
        setResizing,
    };
});
