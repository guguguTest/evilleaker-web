// src/stores/chat.js
import { defineStore } from 'pinia'
import { ref } from 'vue'
import { useMessageStore } from '@/stores/messages'
import { useMessageBadgeStore } from '@/stores/messageBadge'

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

    /**
     * 打开与某个用户的聊天窗口
     * - 这里统一做两件事：
     *   1. 打开聊天窗口（visible = true）
     *   2. 把该好友的未读徽章清零（调用 messageBadgeStore.markFriendAsRead）
     */
    async function openChatWithUser (user) {
        if (!user || !user.id) return

        const msgStore = useMessageStore()
        const badgeStore = useMessageBadgeStore()

        // 先打开窗口（ChatWindow 里会根据 visible 渲染 UI）
        visible.value = true

        // 打开聊天时直接清掉这个好友的未读徽章（乐观更新 + 后端对齐）
        try {
            await badgeStore.markFriendAsRead(user.id)
        } catch (e) {
            // 清未读失败并不会影响聊天窗口打开，所以这里只打日志
            console.error('markFriendAsRead error in chatStore.openChatWithUser', e)
        }

        // 然后再真正拉取会话消息
        await msgStore.openConversationWithUser(user)
    }

    function close () {
        // 不清空会话，仅隐藏 UI
        visible.value = false
    }

    return {
        // state
        visible,
        left,
        top,
        width,
        height,
        isDragging,
        isResizing,
        // actions
        openChatWithUser,
        close,
        setPosition,
        setSize,
        setDragging,
        setResizing,
    }
})
