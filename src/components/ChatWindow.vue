<!-- src/components/ChatWindow.vue -->
<script setup>
import {computed, onUnmounted, ref} from 'vue'
import {useChatStore} from '@/stores/chat'
import {useMessageStore} from '@/stores/messages'
import EmojiPicker from '@/components/EmojiPicker.vue'
import DOMPurify from 'dompurify'

const chatStore = useChatStore()
const messageStore = useMessageStore()

const visible = computed(() => chatStore.visible)
const conversationUser = computed(() => messageStore.conversationUser)
const messages = computed(() => messageStore.conversation || [])  // 防御
const loading = computed(() => messageStore.loadingConversation)

const top = computed(() => chatStore.top)
const left = computed(() => chatStore.left)
const width = computed(() => chatStore.width)
const height = computed(() => chatStore.height)

const inputText = ref('')
const dragging = ref(false)
const resizing = ref(false)
const dragOffset = ref({x: 0, y: 0})
const resizeStart = ref({x: 0, y: 0, w: 0, h: 0})

const safeHtml = (html) =>
    DOMPurify.sanitize(html ?? '', {
      ALLOWED_TAGS: ['b','i','em','strong','a','br','p','ul','ol','li','img','code','pre','span'],
      ALLOWED_ATTR: ['href','target','rel','src','alt','title'],
    })

function close() {
  chatStore.close()
}

function onMouseDownHeader(e) {
  dragging.value = true
  chatStore.setDragging(true)
  dragOffset.value = { x: e.clientX - left.value, y: e.clientY - top.value }
  document.body.style.userSelect = 'none'
  window.addEventListener('mousemove', onMouseMove, { passive: false })
  window.addEventListener('mouseup', onMouseUp)
}

function onMouseDownResize(e) {
  e.stopPropagation()
  resizing.value = true
  chatStore.setResizing(true)
  resizeStart.value = { x: e.clientX, y: e.clientY, w: width.value, h: height.value }
  document.body.style.userSelect = 'none'
  window.addEventListener('mousemove', onMouseMove, { passive: false })
  window.addEventListener('mouseup', onMouseUp)
}

function onMouseMove(e) {
  e.preventDefault() // 关键：让纵向拉伸更跟手
  if (dragging.value) {
    chatStore.setPosition(e.clientX - dragOffset.value.x, e.clientY - dragOffset.value.y)
  } else if (resizing.value) {
    const dx = e.clientX - resizeStart.value.x
    const dy = e.clientY - resizeStart.value.y
    chatStore.setSize(resizeStart.value.w + dx, resizeStart.value.h + dy)
  }
}

function onMouseUp() {
  dragging.value = false
  resizing.value = false
  chatStore.setDragging(false)
  chatStore.setResizing(false)
  document.body.style.userSelect = ''
  window.removeEventListener('mousemove', onMouseMove)
  window.removeEventListener('mouseup', onMouseUp)
}

async function send() {
  const text = inputText.value.trim()
  if (!text) return
  await messageStore.sendChatMessage(text)   // 由 store 负责本地插入/网络发送/失败回滚
  inputText.value = ''
}

function onSelectEmoji(emoji) {
  inputText.value += emoji.text || ''
}

function formatTime(time) {
  if (!time) return ''
  return new Date(time).toLocaleString()
}

onUnmounted(() => {
  window.removeEventListener('mousemove', onMouseMove)
  window.removeEventListener('mouseup', onMouseUp)
})
</script>

<template>
  <Teleport to="body">
    <div v-if="visible && conversationUser" class="chat-modal pc-draggable show">
      <div
          class="chat-container"
          :style="{ top: top + 'px', left: left + 'px', width: width + 'px', height: height + 'px' }"
      >
        <div class="chat-header" @mousedown.prevent="onMouseDownHeader">
          <div class="chat-header-left">
            <img class="chat-avatar" :src="conversationUser.avatar" alt="" />
            <div class="chat-title-wrapper">
              <div class="chat-title">
                {{ conversationUser.nickname || conversationUser.username }}
              </div>
              <div class="chat-subtitle">UID: {{ conversationUser.uid }}</div>
            </div>
          </div>
          <button class="chat-close-btn" @click="close"><i class="fas fa-times"></i></button>
        </div>

        <div class="chat-body">
          <div v-if="loading" class="chat-loading">
            <i class="fas fa-spinner fa-spin"></i><p>加载聊天记录...</p>
          </div>
          <div v-else-if="!messages.length" class="chat-empty">
            暂无聊天记录，发送第一条消息吧
          </div>
          <div v-else class="chat-messages">
            <div v-for="msg in messages" :key="msg.id" :class="['chat-message', msg.is_sent ? 'sent' : 'received']">
              <div class="chat-message-inner">
                <div class="chat-message-content" v-html="safeHtml(msg.content)"></div>
                <div class="chat-message-time">{{ formatTime(msg.created_at) }}</div>
              </div>
            </div>
          </div>
        </div>

        <div class="chat-footer">
          <EmojiPicker @select="onSelectEmoji" />
          <textarea
              v-model="inputText"
              class="chat-input"
              rows="3"
              placeholder="输入消息，按 Enter 发送（Shift+Enter 换行）"
              @keyup.enter.exact.prevent="send"
          />
          <div class="chat-toolbar">
            <button class="chat-send-btn" @click="send">
              <i class="fas fa-paper-plane"></i>发送
            </button>
          </div>
        </div>

        <div class="chat-resize-handle" @mousedown="onMouseDownResize"><i class="fas fa-expand-alt"></i></div>
      </div>
    </div>
  </Teleport>
</template>

<style scoped>
.chat-modal.pc-draggable {
  position: fixed;
  inset: 0;
  z-index: 1300;
  pointer-events: none;
}
.chat-modal.pc-draggable .chat-container { pointer-events: all; }

.chat-container {
  position: absolute;
  background: #fff;
  border-radius: 14px;
  box-shadow: 0 20px 45px rgba(15, 23, 42, 0.35);
  display: flex;
  flex-direction: column;
  overflow: hidden;
  min-width: 360px;
  min-height: 360px; /* 纵向保底 */
  box-sizing: border-box;
}

.chat-header {
  cursor: move;
  display: flex; align-items: center; justify-content: space-between;
  padding: 8px 10px;
  background: linear-gradient(135deg, #667eea, #764ba2);
  color: #fff;
}

.chat-header-left { display: flex; align-items: center; }
.chat-avatar { width: 32px; height: 32px; border-radius: 999px; object-fit: cover; margin-right: 8px; border: 2px solid rgba(255,255,255,.8);}
.chat-title-wrapper { display: flex; flex-direction: column; }
.chat-title { font-weight: 600; font-size: 14px; }
.chat-subtitle { font-size: 12px; opacity: .9; }
.chat-close-btn { border-radius: 999px; width: 26px; height: 26px; border: none; background: rgba(15,23,42,.15); color:#fff; cursor:pointer; }

.chat-body {
  flex: 1;
  padding: 8px 10px;
  background: #f3f4f6;
  overflow-y: auto;
  min-height: 200px; /* 防止内容太少时显得“特别矮” */
}

.chat-loading,.chat-empty { padding: 40px 20px; text-align: center; color: #6b7280; }
.chat-messages { display: flex; flex-direction: column; gap: 8px; }
.chat-message { display: flex; }
.chat-message.sent { justify-content: flex-end; }
.chat-message.received { justify-content: flex-start; }
.chat-message-inner { max-width: 80%; padding: 6px 10px; border-radius: 10px; font-size: 14px; position: relative; }
.chat-message.sent .chat-message-inner { background: #4f46e5; color: #fff; border-bottom-right-radius: 2px; }
.chat-message.received .chat-message-inner { background: #fff; border-bottom-left-radius: 2px; border: 1px solid #e5e7eb; }
.chat-message-content { word-break: break-word; }
.chat-message-time { font-size: 11px; opacity: .7; margin-top: 2px; text-align: right; }

.chat-footer { border-top: 1px solid #e5e7eb; padding: 6px 8px; background: #f9fafb; display: flex; flex-direction: column; gap: 4px; }
.chat-input { width: 100%; border-radius: 8px; border: 1px solid #d1d5db; padding: 6px 8px; font-size: 13px; resize: none; outline: none; }
.chat-toolbar { display: flex; justify-content: flex-end; }
.chat-send-btn { border-radius: 999px; padding: 4px 12px; font-size: 13px; background: linear-gradient(135deg, #667eea, #764ba2); color: #fff; cursor: pointer; }

.chat-resize-handle {
  position: absolute; right: 6px; bottom: 4px;
  width: 18px; height: 18px; cursor: se-resize;
  display: flex; align-items: center; justify-content: center; color: #9ca3af;
}

@media (max-width: 768px) {
  .chat-container {
    position: fixed !important;
    left: 0 !important; top: 0 !important;
    width: 100vw !important; height: 100vh !important;
    max-width: none; max-height: none; border-radius: 0;
  }
}
</style>
