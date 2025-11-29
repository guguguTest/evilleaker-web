<!-- src/components/MessageDropdown.vue -->
<script setup>
import {computed, onMounted, onBeforeUnmount, ref} from 'vue';
import {useMessageStore} from '@/stores/messages';
import {useAuthStore} from '@/stores/auth';
import {useRouter} from 'vue-router';

const props = defineProps({
  mobile: {
    type: Boolean,
    default: false,
  },
});

const messageStore = useMessageStore();
const authStore = useAuthStore();
const root = ref(null);
const router = useRouter();

const open = ref(false);

/** 这里加了默认值，防止 undefined.length 报错 */
const unreadCount = computed(() => messageStore.unreadCount || 0);
const recentMessages = computed(() => messageStore.recentMessages || []);

/** 打开/关闭下拉 */
function toggleDropdown() {
  open.value = !open.value;
  if (open.value) {
    // 打开时刷新最近消息
    messageStore.refreshRecentMessages?.().catch(() => {});
    messageStore.refreshUnreadCount?.().catch(() => {});
  }
}

function closeDropdown() {
  open.value = false;
}

/** 跳转消息中心 */
function goMessageCenter() {
  closeDropdown();
  router.push('/message-center');
}

/** 点击某一条消息 */
function onClickMessageItem(msg) {
  if (!msg.is_read && messageStore.markAsRead) {
    messageStore.markAsRead(msg.id).catch(() => {});
  }
  closeDropdown();
  router.push('/message-center');
}

/** 时间格式化 */
function formatTime(time) {
  if (!time) return '';
  return new Date(time).toLocaleString();
}

/** 消息类型 -> 图标 */
function getTypeIcon(type) {
  if (type === 'system') return 'fa-bullhorn';
  if (type === 'notification') return 'fa-bell';
  if (type === 'auto') return 'fa-robot';
  return 'fa-envelope';
}

/** 点击外部关闭 */
const onDocClick = (e) => {
  if (!root.value) return;
  if (!root.value.contains(e.target)) {
    closeDropdown();
  }
};

onMounted(() => {
  document.addEventListener('click', onDocClick);
  // 初始化拉一次
  messageStore.refreshUnreadCount?.().catch(() => {});
  messageStore.refreshRecentMessages?.().catch(() => {});
});

onBeforeUnmount(() => {
  document.removeEventListener('click', onDocClick);
});
</script>

<template>
  <div
      :class="[
      mobile ? 'message-icon-wrapper-mobile' : 'message-icon-wrapper',
    ]"
      ref="root"
  >
    <i class="fas fa-envelope message-icon" @click.stop="toggleDropdown"></i>

    <span
        v-if="unreadCount > 0"
        class="message-badge"
        :title="`未读消息：${unreadCount}`"
    >
      {{ unreadCount > 99 ? '99+' : unreadCount }}
    </span>

    <div
        :class="[
        mobile ? 'message-dropdown-mobile' : 'message-dropdown',
        { show: open },
      ]"
        @click.stop
    >
      <div class="message-dropdown-header">
        <div class="message-dropdown-title">
          <i class="fas fa-envelope-open-text"></i>
          <span>消息</span>
        </div>
      </div>

      <div class="message-dropdown-body">
        <div v-if="recentMessages.length === 0" class="message-empty">
          <i class="fas fa-inbox"></i>
          <p>暂无消息</p>
        </div>

        <ul v-else class="message-list">
          <li
              v-for="msg in recentMessages"
              :key="msg.id"
              class="message-item"
              @click="onClickMessageItem(msg)"
          >
            <div class="message-item-icon">
              <i class="fas" :class="getTypeIcon(msg.type)"></i>
            </div>
            <div class="message-item-main">
              <div class="message-item-title">
                {{ msg.title || '系统消息' }}
              </div>
              <div class="message-item-snippet">
                {{ msg.content_preview }}
              </div>
              <div class="message-item-time">
                {{ formatTime(msg.created_at) }}
              </div>
            </div>
            <span v-if="!msg.is_read" class="message-item-dot"></span>
          </li>
        </ul>
      </div>

      <div class="message-dropdown-footer">
        <button class="message-more-btn" @click="goMessageCenter">
          <i class="fas fa-paper-plane"></i>
          打开消息中心
        </button>
      </div>
    </div>
  </div>
</template>

<style scoped>
.message-icon-wrapper,
.message-icon-wrapper-mobile {
  position: relative;
  display: inline-flex;
  align-items: center;
  cursor: pointer;
  margin-right: 12px;
  padding: 6px 8px;
  border-radius: 8px;
  transition: all 0.3s;
}

.message-icon-wrapper:hover,
.message-icon-wrapper-mobile:hover {
  background: rgba(59, 130, 246, 0.12);
}

.message-icon {
  font-size: 18px;
  color: #4b5563;
}

.message-badge {
  position: absolute;
  right: -2px;
  top: -2px;
  padding: 0 6px;
  border-radius: 10px;
  background: #ef4444;
  color: #fff;
  font-size: 12px;
  line-height: 18px;
  font-weight: 600;
  min-width: 18px;
  text-align: center;
  display: inline-block;
}

/* 下拉 */
.message-dropdown,
.message-dropdown-mobile {
  position: absolute;
  top: 100%;
  right: 0;
  width: 360px;
  max-height: 480px;
  background: #fff;
  border-radius: 12px;
  box-shadow: 0 12px 30px rgba(15, 23, 42, 0.28);
  margin-top: 8px;
  overflow: hidden;
  opacity: 0;
  transform: translateY(8px);
  pointer-events: none;
  transition: opacity 0.2s ease, transform 0.2s ease;
  z-index: 1200;
}

.message-dropdown.show,
.message-dropdown-mobile.show {
  opacity: 1;
  transform: translateY(0);
  pointer-events: auto;
}

.message-dropdown-header {
  padding: 10px 14px;
  background: linear-gradient(135deg, #667eea, #764ba2);
  color: #fff;
}

.message-dropdown-title {
  display: flex;
  align-items: center;
  gap: 8px;
  font-weight: 600;
}

.message-dropdown-body {
  padding: 6px 8px 10px;
  max-height: 380px;
  overflow-y: auto;
}

.message-empty {
  padding: 40px 20px;
  text-align: center;
  color: #6b7280;
}

.message-empty i {
  font-size: 32px;
  margin-bottom: 10px;
}

.message-list {
  list-style: none;
  padding: 0;
  margin: 0;
}

.message-item {
  display: grid;
  grid-template-columns: 28px 1fr auto;
  gap: 8px;
  padding: 8px 10px;
  border-radius: 10px;
  cursor: pointer;
}

.message-item:hover {
  background: #f3f4f6;
}

.message-item-icon {
  display: flex;
  align-items: center;
  justify-content: center;
  color: #6366f1;
}

.message-item-main {
  min-width: 0;
}

.message-item-title {
  font-size: 14px;
  font-weight: 600;
  color: #111827;
}

.message-item-snippet {
  color: #6b7280;
  font-size: 12px;
  margin-top: 2px;
  overflow: hidden;
  text-overflow: ellipsis;
  white-space: nowrap;
}

.message-item-time {
  color: #9ca3af;
  font-size: 12px;
  text-align: right;
}

.message-item-dot {
  width: 10px;
  height: 10px;
  background: #ef4444;
  border-radius: 50%;
  align-self: center;
}

/* 页脚 */
.message-dropdown-footer {
  padding: 10px;
  border-top: 1px solid #f3f4f6;
  background: #fafafa;
}

.message-more-btn {
  width: 100%;
  padding: 8px 10px;
  border: none;
  border-radius: 8px;
  background: #3b82f6;
  color: #fff;
  cursor: pointer;
  font-weight: 600;
}

.message-more-btn:hover {
  background: #2563eb;
}

/* 移动端避免出屏 */
@media (max-width: 768px) {
  .message-dropdown-mobile {
    position: fixed;
    left: 8px;
    right: 8px;
    top: 56px;
    width: auto;
    max-width: none;
    transform: none;
  }
}
</style>
