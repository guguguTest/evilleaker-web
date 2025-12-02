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
    // 移动端：真正全屏
    return {
      position: 'fixed',
      left: 0,
      top: 0,
      right: 0,
      bottom: 0,
      zIndex: 2500,
      overflow: 'hidden',
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
    // 移动端：卡片占满整个 wrapper
    return {
      width: '100%',
      height: '100%',
      display: 'flex',
      flexDirection: 'column',
      borderRadius: '0',
    }
  }
  // PC 端：限制最大尺寸，避免超出视口
  const safeHeight = Math.min(height.value || 560, Math.floor(window.innerHeight * 0.9))
  const safeWidth = Math.min(width.value || 420, Math.floor(window.innerWidth * 0.9))
  return {
    width: `${safeWidth}px`,
    height: `${safeHeight}px`,
    display: 'flex',
    flexDirection: 'column',
    borderRadius: '12px',
  }
})

/**
 * 消息区域的高度控制
 * - 移动端：flex 1 + min-height: 0，内部滚动
 * - PC：在窗口高度基础上限制一个 maxHeight，内部滚动
 */
const messageWrapperStyle = computed(() => {
  if (isMobile.value) {
    return {
      flex: '1 1 auto',
      minHeight: 0,
    }
  }
  const headerH = 52   // 头部高度
  const footerH = 96   // 底部输入区域 + padding
  const totalH = Math.min(height.value || 560, Math.floor(window.innerHeight * 0.9))
  const maxH = Math.max(180, totalH - headerH - footerH)
  return {
    flex: '1 1 auto',
    minHeight: 0,
    maxHeight: `${Math.floor(maxH)}px`,
  }
})

/* ---------------- 拖动 & 缩放（PC） ---------------- */

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

/* ---------------- 表情解析 & 老数据修复 ---------------- */
/**
 * 统一结构：
 *  - id
 *  - path: 图片路径
 *  - name: 名称（可选）
 *  - audio: 音频路径（可选）
 *
 * 兼容老数据：
 *  "https://api.../xx.png:/emojis/.../sounds/...m4a"
 *  这样的字符串里同时包含图片和音频路径
 */

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

      // ★ 兼容历史：path 里同时包含图片和音频（png:/emojis/...m4a）
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

// 旧格式: id:path:audio?（audio 可能包含冒号）
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

  // [emoji: ...]
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

  // 纯 JSON
  if (raw.startsWith('{') && raw.endsWith('}')) {
    try {
      return normalizeEmojiData(JSON.parse(raw))
    } catch {
      return null
    }
  }

  // 兜底：有些历史数据直接存 JSON 字符串
  try {
    const obj = JSON.parse(raw)
    return normalizeEmojiData(obj)
  } catch {
    return null
  }
}

// 简单缓存避免重复解析
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

async function scrollToBottom () {
  await nextTick()
  const el = messagesScrollRef.value
  const wrap = el?.wrapRef || el?.$refs?.wrapRef
  if (wrap) {
    wrap.scrollTop = wrap.scrollHeight
  }
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
    playEmojiAudio(payload) // 选择时预听
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

/* ---------------- 其他 ---------------- */

function closeWindow () {
  chatStore.close()
}

// 新消息自动滚到底
watch(
    () => messages.value.length,
    async () => {
      if (!visible.value) return
      await scrollToBottom()
    },
)

// 打开窗口时自动滚到底
watch(
    () => visible.value,
    async (v) => {
      if (v) {
        await nextTick()
        await scrollToBottom()
      }
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
      >
        <!-- 头部 -->
        <div class="chat-header" @mousedown="onHeaderMouseDown">
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
              @click="closeWindow"
              title="关闭"
          >
            <el-icon><Close /></el-icon>
          </el-button>
        </div>

        <el-divider class="chat-divider" />

        <!-- 内容区 -->
        <div class="chat-body">
          <!-- 没有选择好友 -->
          <div
              v-if="!conversationUser"
              class="chat-empty"
          >
            请选择一位好友开始聊天
          </div>

          <!-- 有会话 -->
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

            <el-scrollbar
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
                    <!-- emoji 消息 -->
                    <template v-if="getEmojiData(msg.content)">
                      <div class="chat-emoji-msg">
                        <img
                            class="emoji-message-img"
                            :src="buildEmojiUrl(getEmojiData(msg.content).path)"
                            :alt="getEmojiData(msg.content).name || 'emoji'"
                            :data-audio-path="getEmojiData(msg.content).audio || ''"
                            @click="playEmojiAudio(getEmojiData(msg.content))"
                        />
                      </div>
                    </template>

                    <!-- 纯文本 -->
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
            </el-scrollbar>
          </div>
        </div>

        <el-divider class="chat-divider" />

        <!-- 工具栏 + 表情面板 + 输入 -->
        <div class="chat-footer">
          <!-- 工具栏 -->
          <div class="chat-tools">
            <el-button
                circle
                text
                class="chat-toolbar-btn"
                title="选择表情"
                @click="emojiVisible = !emojiVisible"
            >
              <span class="emoji-btn-icon">😊</span>
            </el-button>
          </div>

          <!-- 内嵌表情面板（替代 el-popover） -->
          <div
              v-if="emojiVisible"
              class="chat-emoji-panel"
          >
            <EmojiPicker @select="handleEmojiSelect" />
          </div>

          <!-- 输入 -->
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

        <!-- PC 右下角缩放把手 -->
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
.chat-wrapper {
}

/* 关键：overflow: hidden，防止消息“穿出”窗口 */
.chat-container {
  position: relative;
  display: flex;
  flex-direction: column;
  overflow: hidden;
}

/* 头部 */
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

/* 主体：flex + min-height:0 保证内部可滚动 */
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

/* el-scrollbar 高度 100%，结合上面即可内部滚动 */
.chat-messages {
  flex: 1 1 auto;
  min-height: 0;
  height: 100%;
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

/* emoji 消息 */
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
  background: rgba(255, 255, 255, 0.18);
}

.chat-failed {
  color: #f56c6c;
}

/* 底部 */
.chat-footer {
  padding: 8px 10px 10px;
  display: flex;
  flex-direction: column;
  gap: 6px;
}

/* 工具栏 */
.chat-tools {
  display: flex;
  align-items: center;
  gap: 4px;
}

.chat-toolbar-btn {
  padding: 4px;
}

.emoji-btn-icon {
  font-size: 18px;
  line-height: 1;
}

/* 内嵌表情面板 */
.chat-emoji-panel {
  margin-top: 4px;
  margin-bottom: 4px;
  border: 1px solid #ebeef5;
  border-radius: 8px;
  overflow: hidden;
  background: #fff;
  max-height: 260px;
}

/* 输入区 */
.chat-input-wrapper {
  display: flex;
  align-items: center;
  gap: 8px;
}

.chat-input :deep(.el-input__wrapper) {
  padding-left: 10px;
}

/* 右下角缩放把手（PC） */
.manual-resize-handle {
  position: absolute;
  right: 0;
  bottom: 0;
  width: 18px;
  height: 18px;
  cursor: nwse-resize;
  background: linear-gradient(
      135deg,
      transparent 0 50%,
      rgba(150, 150, 150, 0.35) 50% 100%
  );
  border-radius: 0 0 12px 0;
}

.chat-container--dragging {
  opacity: 0.96;
}

.chat-container--resizing {
  user-select: none;
}

/* 移动端适配 */
@media (max-width: 768px) {
  .chat-header {
    cursor: default;
  }

  .chat-message-bubble {
    max-width: 86vw;
  }

  .chat-footer {
    padding-bottom: 12px;
  }

  .manual-resize-handle {
    display: none;
  }

  .chat-emoji-panel {
    max-height: 50vh;
  }
}
</style>
