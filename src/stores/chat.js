// src/stores/chat.js
import {defineStore} from 'pinia';
import {ref} from 'vue';
import {useMessageStore} from '@/stores/messages';

export const useChatStore = defineStore('chat', () => {
    const visible = ref(false);
    const top = ref(80);   // px
    const left = ref(80);
    const width = ref(420);
    const height = ref(520); // px
    const isDragging = ref(false);
    const isResizing = ref(false);

    function openChatWithUser(user) {
        const messageStore = useMessageStore();
        visible.value = true;
        messageStore.openConversationWithUser(user);
    }

    function close() {
        visible.value = false;
    }

    function setPosition(x, y) {
        left.value = x;
        top.value = y;
    }

    function setSize(w, h) {
        width.value = Math.max(320, w);
        height.value = Math.max(360, h);
    }

    function setDragging(val) {
        isDragging.value = val;
    }

    function setResizing(val) {
        isResizing.value = val;
    }

    return {
        visible,
        top,
        left,
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
