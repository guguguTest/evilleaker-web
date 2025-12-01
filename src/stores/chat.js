// src/stores/chat.js
import { defineStore } from 'pinia'
import { ref } from 'vue'
import { useMessageStore } from '@/stores/messages'

export const useChatStore = defineStore('chat', () => {
    // 是否显示聊天窗口
    const visible = ref(false)

    // 位置/尺寸（PC 可拖拽/缩放；移动端忽略这些）
    const left = ref(80)
    const top = ref(80)
    const width = ref(480)
    const height = ref(560)

    const isDragging = ref(false)
    const isResizing = ref(false)

    // 仅通过 setter 修改（配合“不要直接赋值 store”规范）
    function setPosition (l, t) {
        left.value = Math.max(0, Math.floor(l))
        top.value = Math.max(0, Math.floor(t))
    }

    function setSize (w, h) {
        const minW = 380
        const minH = 420
        const maxW = Math.min(window.innerWidth * 0.9, 800)
        const maxH = Math.min(window.innerHeight * 0.85, 720)
        width.value = Math.min(Math.max(minW, Math.floor(w)), maxW)
        height.value = Math.min(Math.max(minH, Math.floor(h)), maxH)
    }

    function setDragging (flag) {
        isDragging.value = !!flag
    }
    function setResizing (flag) {
        isResizing.value = !!flag
    }

    async function openChatWithUser (user) {
        const msgStore = useMessageStore()
        visible.value = true
        await msgStore.openConversationWithUser(user) // 拉取会话
    }

    function close () {
        visible.value = false // 不清空会话，仅隐藏 UI
    }

    return {
        // state
        visible, left, top, width, height,
        isDragging, isResizing,
        // actions
        openChatWithUser, close,
        setPosition, setSize, setDragging, setResizing,
    }
})
