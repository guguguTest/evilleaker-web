// src/stores/chat.js
import { defineStore } from 'pinia'
import { ref } from 'vue'
import { useMessageStore } from '@/stores/messages'

export const useChatStore = defineStore('chat', () => {
    const visible = ref(false)
    const left = ref(80)
    const top = ref(80)
    const width = ref(520)     // ⬅ 默认更宽
    const height = ref(640)    // ⬅ 默认更高（PC 不再显得矮）
    const isDragging = ref(false)
    const isResizing = ref(false)

    function openChatWithUser(user) {
        const messageStore = useMessageStore()
        visible.value = true
        messageStore.openConversationWithUser(user)

        const vw = window.innerWidth, vh = window.innerHeight
        const w = width.value, h = height.value
        left.value = Math.max((vw - w) / 2, 0)
        top.value = Math.max((vh - h) / 2, 0)
    }

    function close() {
        visible.value = false
    }

    function setPosition(x, y) {
        const vw = window.innerWidth, vh = window.innerHeight
        const w = width.value, h = height.value
        left.value = Math.min(Math.max(0, x), Math.max(0, vw - w))
        top.value = Math.min(Math.max(0, y), Math.max(0, vh - h))
    }

    function setSize(w, h) {
        const vw = window.innerWidth, vh = window.innerHeight
        const newW = Math.max(360, Math.min(w, vw))
        const newH = Math.max(360, Math.min(h, vh))
        width.value = newW
        height.value = newH

        // 尺寸变化时，顺带校准位置，避免窗口超出
        setPosition(left.value, top.value)
    }

    function setDragging(flag) { isDragging.value = flag }
    function setResizing(flag) { isResizing.value = flag }

    return {
        visible, left, top, width, height, isDragging, isResizing,
        openChatWithUser, close, setPosition, setSize, setDragging, setResizing
    }
})
