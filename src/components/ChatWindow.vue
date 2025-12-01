<!-- src/components/ChatWindow.vue -->
<script setup>
import {
  computed,
  nextTick,
  onMounted,
  onUnmounted,
  ref,
  watch,
} from 'vue';
import { useChatStore } from '@/stores/chat';
import { useMessageStore } from '@/stores/messages';
import { useAuthStore } from '@/stores/auth';
import EmojiPicker from '@/components/EmojiPicker.vue';
import { baseUrl } from '@/api/base';
import { joinUrl } from '@/utils/misc';

const chatStore = useChatStore();
const messageStore = useMessageStore();
const authStore = useAuthStore();

const visible = computed(() => chatStore.visible);
const conversationUser = computed(() => messageStore.conversationUser);
const messages = computed(() => messageStore.conversation || []);
const loading = computed(() => messageStore.loadingConversation);

const me = computed(() => authStore.user || {});

const inputText = ref('');
const sending = ref(false);
const emojiVisible = ref(false);

const messagesScrollRef = ref(null);

// ====== 工具函数 ======
function isEmojiMessage(msg) {
  const content = msg?.content;
  if (typeof content !== 'string') return false;
  return content.startsWith('[emoji:') && content.endsWith(']');
}

function parseEmojiContent(content) {
  if (!content || typeof content !== 'string') return null;
  if (!content.startsWith('[emoji:') || !content.endsWith(']')) return null;
  const inner = content.slice(7, -1); // 去掉 "[emoji:" 和 末尾 "]"
  try {
    const trimmed = inner.trim();
    if (trimmed.startsWith('{')) {
      // JSON 形式
      return JSON.parse(trimmed);
    }
    // 兼容老格式 [emoji:id:path:audio?]
    const parts = inner.split(':');
    const [id, path, audio] = parts;
    const data = { id, path, name: '' };
    if (audio) data.audio = audio;
    return data;
  } catch (e) {
    console.error('parseEmojiContent error', e, content);
    return null;
  }
}

function buildEmojiUrl(path) {
  if (!path) return '';
  return joinUrl(baseUrl, path);
}

function playEmojiAudio(emojiData) {
  const audioPath = emojiData?.audio;
  if (!audioPath) return;
  const url = buildEmojiUrl(audioPath);
  const audio = new Audio(url);
  audio.play().catch((e) => {
    console.error('play emoji audio error', e);
  });
}

function isMine(msg) {
  const myId = me.value?.id;
  if (!myId) return !!msg.is_sent;
  return Number(msg.sender_id) === Number(myId);
}

function formatTime(time) {
  if (!time) return '';
  try {
    return new Date(time).toLocaleString();
  } catch {
    return String(time);
  }
}

async function scrollToBottom() {
  await nextTick();
  const wrapper = messagesScrollRef.value;
  if (!wrapper) return;
  // el-scrollbar 里有 wrapRef
  const wrap = wrapper.wrapRef || wrapper.$refs?.wrapRef;
  if (wrap && wrap.scrollHeight != null) {
    wrap.scrollTop = wrap.scrollHeight;
  }
}

// ====== 发送文本 ======
async function handleSend() {
  const text = inputText.value.trim();
  if (!text || sending.value) return;
  if (!conversationUser.value) return;

  sending.value = true;
  try {
    await messageStore.sendChatMessage(text);
    inputText.value = '';
    await scrollToBottom();
  } catch (e) {
    console.error('handleSend error', e);
  } finally {
    sending.value = false;
  }
}

// ====== 发送表情 ======
async function handleEmojiSelect(emoji) {
  if (!emoji || !conversationUser.value) return;
  const emojiData = {
    id: emoji.id,
    path: emoji.file_path,
    name: emoji.emoji_name || emoji.file_name,
  };
  const audioPath = emoji.sound_path || emoji.audio_path;
  if (audioPath) {
    emojiData.audio = audioPath;
    // 点击选择时预播一次，可选
    playEmojiAudio(emojiData);
  }

  const content = `[emoji:${JSON.stringify(emojiData)}]`;

  try {
    sending.value = true;
    await messageStore.sendChatMessage(content);
    emojiVisible.value = false;
    await scrollToBottom();
  } catch (e) {
    console.error('send emoji error', e);
  } finally {
    sending.value = false;
  }
}

// ====== 关闭窗口 ======
function close() {
  chatStore.close();
}

// ====== 键盘回车发送 ======
function onInputKeydown(e) {
  if (e.key === 'Enter' && !e.shiftKey) {
    e.preventDefault();
    handleSend();
  }
}

// ====== 监听会话变化自动滚到底 ======
watch(
    () => messages.value.length,
    () => {
      scrollToBottom();
    },
);

// 初次打开时滚到底
watch(
    () => visible.value,
    (val) => {
      if (val) {
        scrollToBottom();
      }
    },
);

onMounted(() => {
  // 这里如果需要，可以加心跳等逻辑
});

onUnmounted(() => {
  // 清理事件监听之类
});
</script>

<template>
  <transition name="el-fade-in-linear">
    <div v-if="visible" class="chat-wrapper">
      <el-card
          class="chat-container"
          shadow="always"
          :body-style="{ padding: '0' }"
      >
        <!-- 头部 -->
        <div class="chat-header">
          <div class="chat-header-left">
            <el-avatar
                v-if="conversationUser"
                :size="36"
                :src="conversationUser.avatar"
            >
              {{ (conversationUser.nickname || conversationUser.username || 'U')[0] }}
            </el-avatar>
            <div class="chat-title-wrapper" v-if="conversationUser">
              <div class="chat-title">
                {{ conversationUser.nickname || conversationUser.username }}
              </div>
              <div class="chat-subtitle">
                UID: {{ conversationUser.uid }}
              </div>
            </div>
          </div>
          <el-button link circle @click="close">
            <el-icon><Close /></el-icon>
          </el-button>
        </div>

        <el-divider class="chat-divider" />

        <!-- 消息区 -->
        <div class="chat-body">
          <div v-if="!conversationUser" class="chat-empty">
            请选择一位好友开始聊天
          </div>

          <div v-else class="chat-messages-wrapper">
            <div v-if="loading" class="chat-loading">
              <el-icon class="is-loading">
                <Loading />
              </el-icon>
              <span>加载聊天记录...</span>
            </div>

            <div v-else-if="!messages.length" class="chat-empty">
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
                    :class="{ 'chat-message-row--me': isMine(msg) }"
                >
                  <div
                      class="chat-message-bubble"
                      :class="{ 'chat-message-bubble--me': isMine(msg) }"
                  >
                    <!-- emoji 消息 -->
                    <template v-if="isEmojiMessage(msg)">
                      <div class="chat-emoji-msg">
                        <img
                            v-if="parseEmojiContent(msg.content)?.path"
                            class="emoji-message-img"
                            :src="
                            buildEmojiUrl(
                              parseEmojiContent(msg.content).path,
                            )
                          "
                            :alt="parseEmojiContent(msg.content).name || 'emoji'"
                            :data-audio-path="
                            parseEmojiContent(msg.content).audio || ''
                          "
                            @click="playEmojiAudio(parseEmojiContent(msg.content))"
                        />
                      </div>
                    </template>

                    <!-- 普通文本消息 -->
                    <template v-else>
                      <span class="chat-text">
                        {{ msg.content }}
                      </span>
                    </template>
                  </div>
                  <div class="chat-message-meta">
                    <span class="chat-time">
                      {{ formatTime(msg.created_at) }}
                    </span>
                    <span
                        v-if="isMine(msg)"
                        class="chat-read"
                        :class="{ 'chat-read--unread': !msg.is_read }"
                    >
                      {{ msg.is_read ? '已读' : '未读' }}
                    </span>
                    <span v-if="msg.send_error" class="chat-send-error">
                      发送失败
                    </span>
                  </div>
                </div>
              </div>
            </el-scrollbar>
          </div>
        </div>

        <!-- 输入区 -->
        <div class="chat-footer" v-if="conversationUser">
          <div class="chat-toolbar">
            <el-popover
                v-model:visible="emojiVisible"
                placement="top-start"
                :width="360"
                trigger="click"
            >
              <template #reference>
                <el-button circle text class="chat-toolbar-btn">
                  <el-icon><Smile /></el-icon>
                </el-button>
              </template>
              <EmojiPicker @select="handleEmojiSelect" />
            </el-popover>
          </div>

          <div class="chat-input-area">
            <el-input
                v-model="inputText"
                class="chat-input"
                type="textarea"
                :autosize="{ minRows: 1, maxRows: 4 }"
                placeholder="输入消息，Enter 发送，Shift+Enter 换行"
                @keydown="onInputKeydown"
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
      </el-card>
    </div>
  </transition>
</template>

<style scoped>
.chat-wrapper {
  position: fixed;
  right: 24px;
  bottom: 24px;
  z-index: 2500;
}

.chat-container {
  width: 480px;
  max-height: 640px;
  display: flex;
  flex-direction: column;
  border-radius: 12px;
}

.chat-header {
  display: flex;
  align-items: center;
  justify-content: space-between;
  padding: 10px 14px;
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
  font-size: 14px;
  font-weight: 600;
  color: #303133;
}

.chat-subtitle {
  font-size: 12px;
  color: #909399;
}

.chat-divider {
  margin: 0;
}

.chat-body {
  flex: 1;
  min-height: 260px;
  max-height: 420px;
  padding: 8px 10px;
  display: flex;
  flex-direction: column;
}

.chat-messages-wrapper {
  flex: 1;
  display: flex;
  flex-direction: column;
}

.chat-loading {
  flex: 1;
  display: flex;
  flex-direction: column;
  align-items: center;
  justify-content: center;
  color: #909399;
  gap: 6px;
  font-size: 13px;
}

.chat-empty {
  flex: 1;
  display: flex;
  align-items: center;
  justify-content: center;
  color: #909399;
  font-size: 13px;
}

.chat-messages {
  flex: 1;
}

.chat-message-list {
  padding: 4px 2px 8px;
}

.chat-message-row {
  display: flex;
  flex-direction: column;
  align-items: flex-start;
  margin-bottom: 8px;
}

.chat-message-row--me {
  align-items: flex-end;
}

.chat-message-bubble {
  max-width: 80%;
  padding: 6px 10px;
  border-radius: 8px;
  background: #f5f7fa;
  color: #303133;
  font-size: 13px;
  line-height: 1.5;
  word-break: break-word;
}

.chat-message-bubble--me {
  background: #409eff;
  color: #fff;
}

.chat-emoji-msg {
  display: inline-flex;
  align-items: center;
  justify-content: center;
}

.emoji-message-img {
  max-width: 120px;
  max-height: 120px;
  cursor: pointer;
  border-radius: 6px;
}

.chat-message-meta {
  margin-top: 2px;
  font-size: 11px;
  color: #a8abb2;
  display: flex;
  gap: 8px;
}

.chat-read--unread {
  color: #f56c6c;
}

.chat-send-error {
  color: #f56c6c;
}

.chat-footer {
  border-top: 1px solid #ebeef5;
  padding: 6px 10px 8px;
  display: flex;
  flex-direction: column;
  gap: 4px;
}

.chat-toolbar {
  display: flex;
  align-items: center;
}

.chat-toolbar-btn {
  padding: 4px;
}

.chat-input-area {
  display: flex;
  align-items: flex-end;
  gap: 6px;
}

.chat-input :deep(.el-textarea__inner) {
  resize: none;
}

.chat-send-btn {
  white-space: nowrap;
}

@media (max-width: 768px) {
  .chat-wrapper {
    right: 0;
    left: 0;
    bottom: 0;
    padding: 0;
  }

  .chat-container {
    width: 100vw;
    height: 100vh;
    max-height: none;
    border-radius: 0;
  }

  .chat-body {
    max-height: none;
  }
}
</style>
