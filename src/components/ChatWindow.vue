<script setup>
import {
  computed,
  onMounted,
  onUnmounted,
  ref,
  watch,
  nextTick,
} from 'vue'
import { useChatStore } from '@/stores/chat'
import { useMessageStore } from '@/stores/messages'
import { useAuthStore } from '@/stores/auth'
import EmojiPicker from '@/components/EmojiPicker.vue'
import { baseUrl } from '@/api/base'
import { joinUrl } from '@/utils/misc'
import { Close, Loading } from '@element-plus/icons-vue'

const chatStore = useChatStore()
const messageStore = useMessageStore()
const authStore = useAuthStore()

const visible = computed(() => chatStore.visible)
const conversationUser = computed(() => messageStore.conversationUser)
const messages = computed(() => messageStore.conversation || [])
const loading = computed(() => messageStore.loadingConversation)
const me = computed(() => authStore.user || {})

const inputText = ref('')
const sending = ref(false)
const emojiVisible = ref(false)
const messagesScrollRef = ref(null)

// -------- Emoji 解析/渲染（严格不用 v-html，防 XSS）--------
function isEmojiMessage (msg) {
  const content = msg?.content
  return typeof content === 'string' && content.startsWith('[emoji:') && content.endsWith(']')
}

function parseEmojiContent (content) {
  if (!content || typeof content !== 'string') return null
  if (!content.startsWith('[emoji:') || !content.endsWith(']')) return null
  const inner = content.slice(7, -1)
  try {
    if (inner.trim().startsWith('{')) {
      return JSON.parse(inner) // { id, path, name, audio? }
    }
    const [id, path, audio] = inner.split(':')
    const data = { id, path, name: '' }
    if (audio) data.audio = audio
    return data
  } catch (e) {
    console.error('parseEmojiContent error', e, content)
    return null
  }
}

function buildEmojiUrl (path) {
  if (!path) return ''
  return joinUrl(baseUrl, path)
}

function playEmojiAudio (emojiData) {
  const p = emojiData?.audio
  if (!p) return
  const src = p.startsWith('http') ? p : joinUrl(baseUrl, p)
  const audio = new Audio(src)
  audio.volume = 0.7
  audio.play().catch(() => {})
}

// -------- 发送文本/表情 --------
async function scrollToBottom () {
  await nextTick()
  const wrap = messagesScrollRef.value?.wrapRef || messagesScrollRef.value?.$refs?.wrapRef
  if (wrap && wrap.scrollHeight != null) {
    wrap.scrollTop = wrap.scrollHeight
  }
}

async function handleSend () {
  const text = inputText.value.trim()
  if (!text || sending.value || !conversationUser.value) return
  sending.value = true
  try {
    await messageStore.sendChatMessage(text)
    inputText.value = ''
    await scrollToBottom()
  } catch (e) {
    console.error('send text error', e)
  } finally {
    sending.value = false
  }
}

async function handleEmojiSelect (emoji) {
  if (!emoji || !conversationUser.value) return
  const payload = {
    id: emoji.id,
    path: emoji.file_path,
    name: emoji.emoji_name || emoji.file_name,
  }
  const audio = emoji.sound_path || emoji.audio_path
  if (audio) {
    payload.audio = audio
    playEmojiAudio(payload) // 选中时可预听
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

function closeWindow () {
  chatStore.close()
}

// -------- 滚动到底部（新消息）--------
watch(() => messages.value.length, () => {
  scrollToBottom()
})

// -------- PC 拖拽/缩放（移动端忽略）--------
const isMobile = ref(false)
const dragState = ref({ dx: 0, dy: 0, startL: 0, startT: 0 })
const resizeState = ref({ sx: 0, sy: 0, startW: 0, startH: 0 })

function updateIsMobile () {
  isMobile.value = window.innerWidth <= 768
}
function withinViewport (l, t, w, h) {
  const maxL = Math.max(0, window.innerWidth - w)
  const maxT = Math.max(0, window.innerHeight - h)
  return { l: Math.min(Math.max(0, l), maxL), t: Math.min(Math.max(0, t), maxT) }
}
function onHeaderMouseDown (e) {
  if (isMobile.value) return
  e.preventDefault()
  chatStore.setDragging(true)
  dragState.value = {
    dx: e.clientX,
    dy: e.clientY,
    startL: chatStore.left,
    startT: chatStore.top,
  }
  window.addEventListener('mousemove', onHeaderMouseMove)
  window.addEventListener('mouseup', onHeaderMouseUp)
}
function onHeaderMouseMove (e) {
  const ds = dragState.value
  const l = ds.startL + (e.clientX - ds.dx)
  const t = ds.startT + (e.clientY - ds.dy)
  const { l: nl, t: nt } = withinViewport(l, t, chatStore.width, chatStore.height)
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
    startW: chatStore.width,
    startH: chatStore.height,
  }
  window.addEventListener('mousemove', onResizing)
  window.addEventListener('mouseup', onResizeEnd)
}
function onResizing (e) {
  const rs = resizeState.value
  const nw = rs.startW + (e.clientX - rs.sx)
  const nh = rs.startH + (e.clientY - rs.sy)

  // 保持窗口为正方形，宽高相等
  const minSize = 380
  const maxSize = Math.min(window.innerWidth * 0.8, window.innerHeight * 0.8)

  const newSize = Math.min(Math.max(minSize, nw), maxSize)

  chatStore.setSize(newSize, newSize)
}
function onResizeEnd () {
  chatStore.setResizing(false)
  window.removeEventListener('mousemove', onResizing)
  window.removeEventListener('mouseup', onResizeEnd)
}

// -------- 样式绑定 --------
const wrapperStyle = computed(() => {
  if (isMobile.value) {
    return {
      position: 'fixed',
      inset: '0',
      zIndex: 2500,
    }
  }
  return {
    position: 'fixed',
    left: `${chatStore.left}px`,
    top: `${chatStore.top}px`,
    zIndex: 2500,
  }
})

const cardStyle = computed(() => {
  if (isMobile.value) return { height: '100%', width: '100%', borderRadius: '0' }
  return {
    width: `${chatStore.width}px`,
    height: `${chatStore.height}px`,
    display: 'flex',
    flexDirection: 'column',
    borderRadius: '12px',
  }
})

const messageWrapperStyle = computed(() => {
  // 限制消息区域的最大高度，并允许滚动
  const maxHeight = window.innerHeight * 0.6  // 设定最大高度为屏幕的 60%
  return {
    maxHeight: `${maxHeight}px`,
    overflowY: 'auto', // 允许滚动
  }
})

onMounted(() => {
  updateIsMobile()
  window.addEventListener('resize', updateIsMobile)
})

onUnmounted(() => {
  window.removeEventListener('resize', updateIsMobile)
})
</script>

<template>
  <transition name="el-fade-in-linear">
    <div v-if="visible" class="chat-wrapper" :style="wrapperStyle">
      <el-card class="chat-container" shadow="always" :body-style="{ padding: '0' }" :style="cardStyle">
        <!-- 头部 -->
        <div class="chat-header" @mousedown="onHeaderMouseDown">
          <div class="chat-header-left">
            <el-avatar v-if="conversationUser" :size="36" :src="conversationUser.avatar">
              {{ (conversationUser.nickname || conversationUser.username || 'U')[0] }}
            </el-avatar>
            <div class="chat-title-wrapper" v-if="conversationUser">
              <div class="chat-title">{{ conversationUser.nickname || conversationUser.username }}</div>
              <div class="chat-subtitle">UID: {{ conversationUser.uid }}</div>
            </div>
          </div>
          <el-button link circle @click="closeWindow" :title="$t?.('close') || '关闭'">
            <el-icon><Close /></el-icon>
          </el-button>
        </div>

        <el-divider class="chat-divider" />

        <!-- 消息区 -->
        <div class="chat-body">
          <div v-if="!conversationUser" class="chat-empty">请选择一位好友开始聊天</div>

          <div v-else class="chat-messages-wrapper" :style="messageWrapperStyle">
            <div v-if="loading" class="chat-loading">
              <el-icon class="is-loading"><Loading /></el-icon>
              <span>加载中…</span>
            </div>

            <div v-else-if="!messages.length" class="chat-empty">暂无聊天记录，发送第一条消息吧～</div>

            <el-scrollbar v-else ref="messagesScrollRef" class="chat-messages">
              <div class="chat-message-list">
                <div v-for="msg in messages" :key="msg.id" class="chat-message-row" :class="{ 'chat-message-row--me': msg.sender_id === me.id }">
                  <div class="chat-message-bubble" :class="{ 'chat-message-bubble--me': msg.sender_id === me.id }">
                    <!-- emoji -->
                    <template v-if="isEmojiMessage(msg)">
                      <div class="chat-emoji-msg">
                        <img
                            v-if="parseEmojiContent(msg.content)?.path"
                            class="emoji-message-img"
                            :src="buildEmojiUrl(parseEmojiContent(msg.content).path)"
                            :alt="parseEmojiContent(msg.content).name || 'emoji'"
                            :data-audio-path="parseEmojiContent(msg.content).audio || ''"
                            @click="playEmojiAudio(parseEmojiContent(msg.content))"
                        />
                      </div>
                    </template>

                    <!-- 文本 -->
                    <template v-else>
                      <div class="chat-text-msg">{{ msg.content }}</div>
                    </template>

                    <div class="chat-message-meta">
                      <span class="chat-time">{{ new Date(msg.created_at).toLocaleString() }}</span>
                      <span v-if="msg.sender_id === me.id" class="chat-read" :class="{ 'chat-read--unread': !msg.is_read }">
                        {{ msg.is_read ? '已读' : '已送达' }}
                      </span>
                      <span v-if="msg._sendFailed" class="chat-failed">发送失败</span>
                    </div>
                  </div>
                </div>
              </div>
            </el-scrollbar>
          </div>
        </div>

        <el-divider class="chat-divider" />

        <!-- 工具栏 + 输入区 -->
        <div class="chat-footer">
          <div class="chat-toolbar">
            <el-popover v-model:visible="emojiVisible" placement="top-start" :width="360" trigger="click">
              <template #reference>
                <el-button circle text class="chat-toolbar-btn" :title="'选择表情'">
                  <span aria-hidden="true" style="font-size:18px;line-height:1">😊</span>
                </el-button>
              </template>
              <EmojiPicker @select="handleEmojiSelect" />
            </el-popover>
          </div>

          <div class="chat-input-area">
            <el-input
                v-model="inputText"
                class="chat-input"
                :placeholder="'输入消息…'"
                type="text"
                clearable
                @keyup.enter.exact.prevent="handleSend"
            />
            <el-button type="primary" class="chat-send-btn" :loading="sending" :disabled="!inputText.trim()" @click="handleSend">
              发送
            </el-button>
          </div>
        </div>

        <!-- PC 右下角缩放把手 -->
        <div v-if="!isMobile" class="manual-resize-handle" @mousedown="onResizeHandleMouseDown" />
      </el-card>
    </div>
  </transition>
</template>

<style scoped>
.chat-wrapper { }
.chat-container { display: flex; flex-direction: column; }

/* 头部 */
.chat-header {
  height: 52px;
  display: flex; align-items: center; justify-content: space-between;
  padding: 0 10px 0 12px; cursor: move;
}
.chat-header-left { display: flex; align-items: center; gap: 10px; }
.chat-title { font-size: 15px; font-weight: 600; }
.chat-subtitle { font-size: 12px; color: #909399; }

.chat-divider { margin: 0; }

.chat-body { flex: 1 1 auto; display: flex; flex-direction: column; }
.chat-empty {
  min-height: 160px; display: flex; align-items: center; justify-content: center;
  color: #909399;
}
.chat-loading { min-height: 120px; display: flex; align-items: center; justify-content: center; gap: 8px; color: #606266; }

.chat-messages { height: 100%; }
.chat-message-list { padding: 12px; display: flex; flex-direction: column; gap: 10px; }
.chat-message-row { display: flex; }
.chat-message-row--me { justify-content: flex-end; }
.chat-message-bubble {
  max-width: 70%; border-radius: 10px; padding: 8px 10px; background-color: #f5f7fa;
}
.chat-message-bubble--me { background-color: #ecf5ff; }
.chat-text-msg { white-space: pre-wrap; word-break: break-word; }
.chat-emoji-msg img { max-width: 120px; max-height: 120px; vertical-align: middle; border-radius: 6px; cursor: pointer; }
.chat-message-meta {
  margin-top: 2px; font-size: 11px; color: #a8abb2; display: flex; gap: 8px;
}
.chat-read--unread { color: #f59a23; }
.chat-failed { color: #f56c6c; }

/* 底部工具栏 + 输入 */
.chat-footer { padding: 10px; padding-top: 6px; }
.chat-toolbar { margin-bottom: 6px; }
.chat-toolbar-btn { width: 32px; height: 32px; }

.chat-input-area { display: flex; align-items: center; gap: 8px; }
.chat-input :deep(.el-input__wrapper) { padding-left: 10px; }

/* 右下角缩放把手（PC） */
.manual-resize-handle {
  position: absolute; right: 0; bottom: 0;
  width: 18px; height: 18px; cursor: nwse-resize;
  background: linear-gradient(135deg, transparent 0 50%, rgba(150,150,150,.35) 50% 100%);
  border-radius: 0 0 12px 0;
}

@media (max-width: 768px) {
  .chat-header { cursor: default; }
  .chat-message-bubble { max-width: 86vw; }
}
</style>
