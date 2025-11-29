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
        // 打开时居中
        const vw = window.innerWidth, vh = window.innerHeight;
        const w = width.value, h = height.value;
        left.value = Math.max((vw - w) / 2, 0);
        top.value  = Math.max((vh - h) / 2, 0);
    }

    function close() {
        visible.value = false;
    }

    function setPosition(x, y) {
        const vw = window.innerWidth, vh = window.innerHeight;
        const w = width.value, h = height.value;
        left.value = Math.min(Math.max(0, x), Math.max(0, vw - w));
        top.value  = Math.min(Math.max(0, y), Math.max(0, vh - h));
    }

    function setSize(w, h) {
        width.value = Math.max(320, Math.min(w, window.innerWidth));
        height.value = Math.max(360, Math.min(h, window.innerHeight));
    }

    function setDragging(flag) { isDragging.value = flag; }
    function setResizing(flag) { isResizing.value = flag; }

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
