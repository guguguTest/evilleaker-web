<!-- src/components/ChatWindow.vue -->
<script setup>
import {
  computed,
  onMounted,
  onUnmounted,
  ref,
  watch,
  nextTick,
} from 'vue'
import { storeToRefs } from 'pinia'
import { useChatStore } from '@/stores/chat'
import { useMessageStore } from '@/stores/messages'
import { useAuthStore } from '@/stores/auth'
import EmojiPicker from '@/components/EmojiPicker.vue'
import { baseUrl } from '@/api/base'
import { joinUrl } from '@/utils/misc'
import { Close, Loading } from '@element-plus/icons-vue'

/* ---------------- store & 基本状态 ---------------- */

const chatStore = useChatStore()
const messageStore = useMessageStore()
const authStore = useAuthStore()

const {
  visible,
  left,
  top,
  width,
  height,
  isDragging,
  isResizing,
} = storeToRefs(chatStore)

const {
  conversationUser,
  loadingConversation,
  conversation,
} = storeToRefs(messageStore)

const me = computed(() => authStore.user || {})
const messages = computed(() => conversation.value || [])

const isMobile = ref(false)
const emojiVisible = ref(false)
const inputText = ref('')
const sending = ref(false)

const messagesScrollRef = ref(null)

/* ---------------- 布局 & 尺寸 ---------------- */

function updateIsMobile () {
  isMobile.value = window.innerWidth <= 768
}

const wrapperStyle = computed(() => {
  if (isMobile.value) {
    return {
      position: 'fixed',
      left: 0,
      right: 0,
      bottom: 0,
      zIndex: 2500,
      display: 'flex',
      justifyContent: 'center',
      pointerEvents: 'auto',
    }
  }
  return {
    position: 'fixed',
    left: `${left.value}px`,
    top: `${top.value}px`,
    zIndex: 2500,
  }
})

const cardStyle = computed(() => {
  if (isMobile.value) {
    const vh = window.innerHeight || 800
    const h = Math.floor(vh * 0.75)
    return {
      width: '100vw',
      maxWidth: '480px',
      height: `${h}px`,
      display: 'flex',
      flexDirection: 'column',
      borderRadius: '12px 12px 0 0',
    }
  }
  const safeHeight = Math.min(height.value || 560, Math.floor(window.innerHeight * 0.9))
  const safeWidth = Math.min(width.value || 460, Math.floor(window.innerWidth * 0.9))
  return {
    width: `${safeWidth}px`,
    height: `${safeHeight}px`,
    display: 'flex',
    flexDirection: 'column',
    borderRadius: '12px',
  }
})

const messageWrapperStyle = computed(() => {
  const headerH = 52
  const footerH = 96
  if (isMobile.value) {
    const vh = window.innerHeight || 800
    const totalH = Math.floor(vh * 0.75)
    const maxH = Math.max(120, totalH - headerH - footerH)
    return {
      flex: '1 1 auto',
      minHeight: '0',
      maxHeight: `${Math.floor(maxH)}px`,
    }
  }
  const totalH = Math.min(height.value || 560, Math.floor(window.innerHeight * 0.9))
  const maxH = Math.max(180, totalH - headerH - footerH)
  return {
    flex: '1 1 auto',
    minHeight: '0',
    maxHeight: `${Math.floor(maxH)}px`,
  }
})

/* ---------------- 拖动 & 缩放（PC + 平板触摸） ---------------- */

const dragState = ref({
  dx: 0,
  dy: 0,
  startL: 0,
  startT: 0,
})

const resizeState = ref({
  sx: 0,
  sy: 0,
  startW: 0,
  startH: 0,
})

function withinViewport (l, t, w, h) {
  const maxL = Math.max(0, window.innerWidth - w)
  const maxT = Math.max(0, window.innerHeight - h)
  return {
    l: Math.min(Math.max(0, l), maxL),
    t: Math.min(Math.max(0, t), maxT),
  }
}

function onHeaderMouseDown (e) {
  if (isMobile.value) return
  e.preventDefault()
  chatStore.setDragging(true)
  dragState.value = {
    dx: e.clientX,
    dy: e.clientY,
    startL: left.value,
    startT: top.value,
  }
  window.addEventListener('mousemove', onHeaderMouseMove)
  window.addEventListener('mouseup', onHeaderMouseUp)
}

function onHeaderMouseMove (e) {
  const ds = dragState.value
  const l = ds.startL + (e.clientX - ds.dx)
  const t = ds.startT + (e.clientY - ds.dy)
  const { l: nl, t: nt } = withinViewport(l, t, width.value, height.value)
  chatStore.setPosition(nl, nt)
}

function onHeaderMouseUp () {
  chatStore.setDragging(false)
  window.removeEventListener('mousemove', onHeaderMouseMove)
  window.removeEventListener('mouseup', onHeaderMouseUp)
}

// 触摸拖动（平板等 PC 布局）
function onHeaderTouchStart (e) {
  if (isMobile.value) return
  if (!e.touches || !e.touches.length) return
  const t = e.touches[0]
  e.preventDefault()
  chatStore.setDragging(true)
  dragState.value = {
    dx: t.clientX,
    dy: t.clientY,
    startL: left.value,
    startT: top.value,
  }
  window.addEventListener('touchmove', onHeaderTouchMove, { passive: false })
  window.addEventListener('touchend', onHeaderTouchEnd)
}

function onHeaderTouchMove (e) {
  if (!e.touches || !e.touches.length) return
  const touch = e.touches[0]
  e.preventDefault()
  const ds = dragState.value
  const l = ds.startL + (touch.clientX - ds.dx)
  const t = ds.startT + (touch.clientY - ds.dy)
  const { l: nl, t: nt } = withinViewport(l, t, width.value, height.value)
  chatStore.setPosition(nl, nt)
}

function onHeaderTouchEnd () {
  chatStore.setDragging(false)
  window.removeEventListener('touchmove', onHeaderTouchMove)
  window.removeEventListener('touchend', onHeaderTouchEnd)
}

function onResizeHandleMouseDown (e) {
  if (isMobile.value) return
  e.preventDefault()
  chatStore.setResizing(true)
  resizeState.value = {
    sx: e.clientX,
    sy: e.clientY,
    startW: width.value,
    startH: height.value,
  }
  window.addEventListener('mousemove', onResizing)
  window.addEventListener('mouseup', onResizeEnd)
}

function onResizing (e) {
  const rs = resizeState.value
  const nw = rs.startW + (e.clientX - rs.sx)
  const nh = rs.startH + (e.clientY - rs.sy)
  chatStore.setSize(nw, nh)
}

function onResizeEnd () {
  chatStore.setResizing(false)
  window.removeEventListener('mousemove', onResizing)
  window.removeEventListener('mouseup', onResizeEnd)
}

/* ---------------- 表情解析 & 老数据兼容 ---------------- */

function normalizeEmojiData (obj) {
  if (!obj || typeof obj !== 'object') return null

  let id =
      obj.id ??
      obj.emoji_id ??
      obj.emojiId ??
      obj.emoji?.id ??
      null

  let path =
      obj.path ??
      obj.emoji_path ??
      obj.file_path ??
      obj.emoji?.path ??
      obj.emoji?.file_path ??
      null

  const name =
      obj.name ??
      obj.emoji_name ??
      obj.file_name ??
      obj.emoji?.name ??
      obj.emoji?.emoji_name ??
      ''

  let audio =
      obj.audio ??
      obj.sound_path ??
      obj.audio_path ??
      obj.emoji?.sound_path ??
      obj.emoji?.audio_path ??
      null

  if (!path || typeof path !== 'string') return null

      ;(() => {
    const raw = path
    const protoIdx = raw.indexOf('://')
    const searchFrom = protoIdx >= 0 ? protoIdx + 3 : 0
    const sepIdx = raw.indexOf(':/', searchFrom)
    if (sepIdx > 0) {
      const imgPart = raw.slice(0, sepIdx)
      const audioPart = raw.slice(sepIdx + 1)
      path = imgPart
      if (!audio && audioPart) {
        audio = audioPart.startsWith('/') ? audioPart : '/' + audioPart
      }
    }
  })()

  return { id, path, name, audio }
}

function parseLegacyTriplet (inner) {
  const parts = inner.split(':')
  const id = parts[0]
  const path = parts[1]
  const audio = parts.slice(2).join(':') || null
  return normalizeEmojiData({ id, path, audio })
}

function parseEmojiAny (content) {
  if (typeof content !== 'string') return null
  const raw = content.trim()

  if (raw.startsWith('[emoji:') && raw.endsWith(']')) {
    const inner = raw.slice(7, -1)
    try {
      if (inner.trim().startsWith('{')) {
        return normalizeEmojiData(JSON.parse(inner))
      }
      return parseLegacyTriplet(inner)
    } catch {
      return null
    }
  }

  if (raw.startsWith('{') && raw.endsWith('}')) {
    try {
      return normalizeEmojiData(JSON.parse(raw))
    } catch {
      return null
    }
  }

  try {
    const obj = JSON.parse(raw)
    return normalizeEmojiData(obj)
  } catch {
    return null
  }
}

const emojiParseCache = new Map()

function getEmojiData (content) {
  if (!content || typeof content !== 'string') return null
  if (emojiParseCache.has(content)) return emojiParseCache.get(content)
  const parsed = parseEmojiAny(content)
  emojiParseCache.set(content, parsed)
  return parsed
}

function buildEmojiUrl (path) {
  if (!path) return ''
  if (/^https?:\/\//i.test(path)) return path
  return joinUrl(baseUrl, path)
}

function playEmojiAudio (emojiData) {
  const p = emojiData?.audio
  if (!p) return
  const src = /^https?:\/\//i.test(p) ? p : joinUrl(baseUrl, p)
  const audio = new Audio(src)
  audio.volume = 0.7
  audio.play().catch(() => {})
}

/* ---------------- 发送文本 / 发送表情 ---------------- */

/**
 * 加强版：滚动到最后一条消息位置
 * - 使用 scrollIntoView 对最后一条 .chat-message-row 定位
 * - 再用两次 requestAnimationFrame 兜底图片 / 布局延迟
 */
async function scrollToBottom () {
  await nextTick()
  const container = messagesScrollRef.value
  if (!container) return

  const doScroll = () => {
    const lastRow = container.querySelector('.chat-message-row:last-child')
    if (lastRow && typeof lastRow.scrollIntoView === 'function') {
      lastRow.scrollIntoView({ block: 'end', behavior: 'auto' })
    } else {
      container.scrollTop = container.scrollHeight
    }
  }

  doScroll()
  requestAnimationFrame(() => {
    requestAnimationFrame(doScroll)
  })
}

async function handleSend () {
  const text = (inputText.value || '').trim()
  if (!text || !conversationUser.value || sending.value) return

  sending.value = true
  try {
    await messageStore.sendChatMessage(text)
    inputText.value = ''
    await scrollToBottom()
  } catch (e) {
    console.error('send chat message error', e)
  } finally {
    sending.value = false
  }
}

async function handleEmojiSelect (emoji) {
  if (!emoji || !conversationUser.value) return

  const payload = {
    id: emoji.id,
    path: emoji.file_path || emoji.emoji_path || emoji.path,
    name: emoji.emoji_name || emoji.file_name || emoji.name,
  }
  const audio = emoji.sound_path || emoji.audio_path || emoji.audio
  if (audio) {
    payload.audio = audio
    playEmojiAudio(payload)
  }

  const content = `[emoji:${JSON.stringify(payload)}]`

  try {
    sending.value = true
    await messageStore.sendChatMessage(content)
    emojiVisible.value = false
    await scrollToBottom()
  } catch (e) {
    console.error('send emoji error', e)
  } finally {
    sending.value = false
  }
}

/* ---------------- 表情弹窗 & 点击外部关闭 ---------------- */

function toggleEmoji () {
  emojiVisible.value = !emojiVisible.value
}

function onContainerClick () {
  if (emojiVisible.value) emojiVisible.value = false
}

/* ---------------- 其他 ---------------- */

function closeWindow () {
  emojiVisible.value = false
  chatStore.close()
}

watch(
    () => messages.value.length,
    async () => {
      if (!visible.value) return
      await scrollToBottom()
    },
)

watch(
    () => visible.value,
    async v => {
      if (!v) {
        emojiVisible.value = false
        return
      }
      await scrollToBottom()
    },
)

onMounted(() => {
  updateIsMobile()
  window.addEventListener('resize', updateIsMobile)
})

onUnmounted(() => {
  window.removeEventListener('resize', updateIsMobile)
  window.removeEventListener('mousemove', onHeaderMouseMove)
  window.removeEventListener('mouseup', onHeaderMouseUp)
  window.removeEventListener('mousemove', onResizing)
  window.removeEventListener('mouseup', onResizeEnd)
  window.removeEventListener('touchmove', onHeaderTouchMove)
  window.removeEventListener('touchend', onHeaderTouchEnd)
})
</script>

<template>
  <transition name="el-fade-in-linear">
    <div v-if="visible" class="chat-wrapper" :style="wrapperStyle">
      <el-card
          class="chat-container"
          shadow="always"
          :body-style="{ padding: '0' }"
          :class="{
          'chat-container--dragging': isDragging,
          'chat-container--resizing': isResizing,
        }"
          :style="cardStyle"
          @click="onContainerClick"
      >
        <!-- 头部 -->
        <div
            class="chat-header"
            @mousedown="onHeaderMouseDown"
            @touchstart.stop="onHeaderTouchStart"
        >
          <div class="chat-header-left">
            <el-avatar
                v-if="conversationUser"
                :size="36"
                :src="conversationUser.avatar"
            >
              {{ (conversationUser.nickname || conversationUser.username || 'U')[0] }}
            </el-avatar>
            <div v-if="conversationUser" class="chat-title-wrapper">
              <div class="chat-title">
                {{ conversationUser.nickname || conversationUser.username }}
              </div>
              <div class="chat-subtitle">
                UID: {{ conversationUser.uid }}
              </div>
            </div>
          </div>

          <el-button
              link
              circle
              @click.stop="closeWindow"
              title="关闭"
          >
            <el-icon><Close /></el-icon>
          </el-button>
        </div>

        <el-divider class="chat-divider" />

        <!-- 内容区 -->
        <div class="chat-body">
          <div
              v-if="!conversationUser"
              class="chat-empty"
          >
            请选择一位好友开始聊天
          </div>

          <div
              v-else
              class="chat-messages-wrapper"
              :style="messageWrapperStyle"
          >
            <div v-if="loadingConversation" class="chat-loading">
              <el-icon class="is-loading"><Loading /></el-icon>
              <span>加载中…</span>
            </div>

            <div
                v-else-if="!messages.length"
                class="chat-empty"
            >
              暂无聊天记录，发送第一条消息吧～
            </div>

            <div
                v-else
                ref="messagesScrollRef"
                class="chat-messages"
            >
              <div class="chat-message-list">
                <div
                    v-for="msg in messages"
                    :key="msg.id"
                    class="chat-message-row"
                    :class="{ 'chat-message-row--me': msg.sender_id === me.id }"
                >
                  <div
                      class="chat-message-bubble"
                      :class="{ 'chat-message-bubble--me': msg.sender_id === me.id }"
                  >
                    <template v-if="getEmojiData(msg.content)">
                      <div class="chat-emoji-msg">
                        <img
                            class="emoji-message-img"
                            :src="buildEmojiUrl(getEmojiData(msg.content).path)"
                            :alt="getEmojiData(msg.content).name || 'emoji'"
                            :data-audio-path="getEmojiData(msg.content).audio || ''"
                            @click.stop="playEmojiAudio(getEmojiData(msg.content))"
                        />
                      </div>
                    </template>

                    <template v-else>
                      <div class="chat-text-msg">
                        {{ msg.content }}
                      </div>
                    </template>

                    <div class="chat-message-meta">
                      <span class="chat-time">
                        {{ new Date(msg.created_at).toLocaleString() }}
                      </span>
                      <span
                          v-if="msg.sender_id === me.id"
                          class="chat-read"
                          :class="{ 'chat-read--unread': !msg.is_read }"
                      >
                        {{ msg.is_read ? '已读' : '已送达' }}
                      </span>
                      <span
                          v-if="msg._sendFailed"
                          class="chat-failed"
                      >
                        发送失败
                      </span>
                    </div>
                  </div>
                </div>
              </div>
            </div>
          </div>
        </div>

        <el-divider class="chat-divider" />

        <!-- 工具栏 + 表情弹窗 + 输入区 -->
        <div class="chat-footer">
          <div class="chat-tools">
            <div class="emoji-trigger-wrapper">
              <el-button
                  circle
                  text
                  class="chat-toolbar-btn"
                  title="选择表情"
                  @click.stop="toggleEmoji"
              >
                <span class="emoji-btn-icon">😊</span>
              </el-button>

              <transition name="chat-emoji-popup-fade">
                <div
                    v-if="emojiVisible"
                    class="chat-emoji-popup"
                    @click.stop
                >
                  <EmojiPicker @select="handleEmojiSelect" />
                </div>
              </transition>
            </div>
          </div>

          <div class="chat-input-wrapper">
            <el-input
                v-model="inputText"
                class="chat-input"
                placeholder="输入消息…"
                @keydown.enter.prevent="handleSend"
            />
            <el-button
                type="primary"
                class="chat-send-btn"
                :loading="sending"
                :disabled="!inputText.trim()"
                @click="handleSend"
            >
              发送
            </el-button>
          </div>
        </div>

        <div
            v-if="!isMobile"
            class="manual-resize-handle"
            @mousedown="onResizeHandleMouseDown"
        />
      </el-card>
    </div>
  </transition>
</template>

<style scoped>
.chat-wrapper {}

.chat-container {
  position: relative;
  display: flex;
  flex-direction: column;
  overflow: hidden;
}

.chat-header {
  height: 52px;
  display: flex;
  align-items: center;
  justify-content: space-between;
  padding: 0 10px 0 12px;
  cursor: move;
}

.chat-header-left {
  display: flex;
  align-items: center;
  gap: 10px;
}

.chat-title-wrapper {
  display: flex;
  flex-direction: column;
}

.chat-title {
  font-size: 15px;
  font-weight: 600;
}

.chat-subtitle {
  font-size: 12px;
  color: #909399;
}

.chat-divider {
  margin: 0;
}

.chat-body {
  flex: 1 1 auto;
  min-height: 0;
  padding: 10px 12px;
  display: flex;
  flex-direction: column;
}

.chat-messages-wrapper {
  flex: 1 1 auto;
  min-height: 0;
  display: flex;
  flex-direction: column;
}

.chat-messages {
  flex: 1 1 auto;
  min-height: 0;
  height: 100%;
  overflow-y: auto;
}

.chat-loading,
.chat-empty {
  height: 100%;
  min-height: 180px;
  display: flex;
  align-items: center;
  justify-content: center;
  color: #909399;
  font-size: 13px;
}

.chat-loading .el-icon {
  margin-right: 6px;
}

.chat-message-list {
  padding: 4px 0 8px;
}

.chat-message-row {
  display: flex;
  margin-bottom: 8px;
}

.chat-message-row--me {
  justify-content: flex-end;
}

.chat-message-bubble {
  max-width: 70%;
  background: #f5f7fa;
  border-radius: 14px;
  padding: 8px 10px;
  font-size: 14px;
  position: relative;
  word-break: break-word;
}

.chat-message-bubble--me {
  background: #409eff;
  color: #fff;
}

.chat-text-msg {
  white-space: pre-wrap;
}

.chat-emoji-msg {
  display: flex;
  align-items: center;
  justify-content: center;
}

.chat-emoji-msg img {
  max-width: 120px;
  max-height: 120px;
  border-radius: 8px;
  cursor: pointer;
}

.chat-message-meta {
  margin-top: 4px;
  font-size: 11px;
  color: rgba(0, 0, 0, 0.45);
  display: flex;
  gap: 6px;
  align-items: center;
}

.chat-message-bubble--me .chat-message-meta {
  color: rgba(255, 255, 255, 0.75);
}

.chat-read {
  padding: 0 4px;
  border-radius: 4px;
  background: rgba(0, 0, 0, 0.04);
}

.chat-read--unread {
  background: rgba(0, 0, 0, 0.06);
}

.chat-failed {
  color: #f56c6c;
}

.chat-footer {
  padding: 8px 10px 10px;
  display: flex;
  flex-direction: column;
  gap: 6px;
}

.chat-tools {
  display: flex;
  align-items: center;
  gap: 4px;
}

.emoji-trigger-wrapper {
  position: relative;
  display: inline-flex;
}

.chat-toolbar-btn {
  padding: 4px;
}

.emoji-btn-icon {
  font-size: 18px;
  line-height: 1;
}

.chat-emoji-popup {
  position: absolute;
  left: 0;
  bottom: 40px;
  /* ★ 横向稍微加宽一点，并和 EmojiPicker 的宽度匹配 */
  width: 380px;
  max-width: 95vw;

  /* 高度只做一个约束，真正的纵向滚动由 EmojiPicker 内部的 .emoji-grid 控制 */
  max-height: 320px;

  border: 1px solid #ebeef5;
  border-radius: 8px;
  background: #fff;

  /* 不让整个弹窗自己滚动，避免分类栏跟着上下跑 */
  overflow: visible;

  box-shadow: 0 2px 12px rgba(0, 0, 0, 0.12);
  z-index: 20;
}

/* 移动端适配：宽度紧贴屏幕，分类栏仍然在底部水平拖动 */
@media (max-width: 768px) {
  .chat-emoji-popup {
    width: 95vw;
    max-width: 95vw;
    max-height: 60vh;
  }
}

</style>
