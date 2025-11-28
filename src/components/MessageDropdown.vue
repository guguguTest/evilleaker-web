<!-- src/components/MessageDropdown.vue -->
<script setup>
import {computed, onMounted, ref} from 'vue';
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
const router = useRouter();

const open = ref(false);
const loading = computed(() => messageStore.loadingDropdown);
const recentMessages = computed(() => messageStore.recent);
const unreadCount = computed(() => messageStore.unreadCount);

function toggleDropdown() {
  if (!authStore.token) {
    router.push('/login');
    return;
  }
  open.value = !open.value;
  if (open.value && recentMessages.value.length === 0) {
    // 首次打开时加载最近消息 & 未读数
    messageStore.refreshUnreadCount().catch(() => {});
    messageStore.refreshRecentMessages().catch(() => {});
  }
}

function closeDropdown() {
  open.value = false;
}

function goMessageCenter() {
  closeDropdown();
  router.push('/message-center');
}

function onClickMessageItem(msg) {
  if (!msg.is_read) {
    messageStore.markAsRead(msg.id).catch(() => {});
  }
  // 这里可以按需要做进一步动作：弹详情等
  // 暂时只标记已读
}

// 简单格式化时间
function formatTime(time) {
  if (!time) return '';
  return new Date(time).toLocaleString();
}

// 消息类型 -> 图标
function getTypeIcon(type) {
  if (type === 'system') return 'fa-bullhorn';
  if (type === 'notification') return 'fa-bell';
  if (type === 'auto') return 'fa-robot';
  return 'fa-envelope';
}

onMounted(() => {
  // 初始化未读数（登录后）
  if (authStore.token) {
    messageStore.refreshUnreadCount().catch(() => {});
  }
});
</script>

<template>
  <div
      :class="[
      mobile ? 'message-icon-wrapper-mobile' : 'message-icon-wrapper',
    ]"
      @mouseleave="closeDropdown"
  >
    <i class="fas fa-envelope message-icon" @click.stop="toggleDropdown"></i>
    <span
        v-if="unreadCount > 0"
        class="message-badge"
        :title="`未读消息 ${unreadCount} 条`"
    >
      {{ unreadCount > 99 ? '99+' : unreadCount }}
    </span>

    <!-- 下拉 -->
    <div
        :class="[
        mobile ? 'message-dropdown-mobile' : 'message-dropdown',
        { show: open },
      ]"
        @click.stop
    >
      <div class="message-dropdown-header">
        <div class="message-dropdown-title">
          <i class="fas fa-envelope-open"></i>
          <span>消息</span>
        </div>
      </div>

      <div class="message-dropdown-body">
        <div v-if="loading" class="message-loading">
          <i class="fas fa-spinner fa-spin"></i>
          <p>加载中...</p>
        </div>

        <div v-else-if="!recentMessages.length" class="message-empty">
          暂无消息
        </div>

        <div v-else class="message-list">
          <div
              v-for="msg in recentMessages"
              :key="msg.id"
              class="message-item"
              :class="{ unread: !msg.is_read }"
              @click="onClickMessageItem(msg)"
          >
            <div class="message-type-icon" :class="msg.message_type">
              <i class="fas" :class="getTypeIcon(msg.message_type)"></i>
            </div>
            <div class="message-content-wrapper">
              <div class="message-title">
                {{ msg.title || '无标题' }}
              </div>
              <div class="message-preview">
                {{ (msg.content || '').slice(0, 50) }}{{ (msg.content || '').length > 50 ? '...' : '' }}
              </div>
              <div class="message-time">
                {{ formatTime(msg.created_at) }}
              </div>
            </div>
          </div>
        </div>
      </div>

      <div class="message-dropdown-footer">
        <a href="javascript:void(0);" class="view-all-messages" @click="goMessageCenter">
          查看全部消息
        </a>
      </div>
    </div>
  </div>
</template>

<style scoped>
/* 下面的样式基本来自 origin_project/css/message.css，做了少量收缩 */
/* 图标外层 */
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
  background: rgba(102, 126, 234, 0.08);
}

.message-icon {
  font-size: 1.2rem;
  color: #6c757d;
  transition: all 0.3s;
}

.message-icon-wrapper:hover .message-icon,
.message-icon-wrapper-mobile:hover .message-icon {
  color: #495057;
  transform: scale(1.1);
}

/* 未读角标 */
.message-badge {
  position: absolute;
  top: -4px;
  right: -4px;
  background: linear-gradient(135deg, #ff4d4d, #dc3545);
  color: #fff;
  border-radius: 999px;
  min-width: 18px;
  padding: 0 4px;
  text-align: center;
  font-size: 11px;
  line-height: 18px;
  font-weight: 600;
  box-shadow: 0 2px 4px rgba(220, 53, 69, 0.45);
}

/* 下拉 */
.message-dropdown,
.message-dropdown-mobile {
  position: absolute;
  top: 100%;
  right: 0;
  width: 360px;
  max-height: 460px;
  background: #fff;
  border-radius: 12px;
  box-shadow: 0 10px 25px rgba(15, 23, 42, 0.25);
  margin-top: 8px;
  overflow: hidden;
  opacity: 0;
  transform: translateY(8px);
  pointer-events: none;
  transition: opacity 0.2s ease, transform 0.2s ease;
  z-index: 1200;
}

.message-dropdown-mobile {
  right: auto;
  left: -140px;
  width: calc(100vw - 32px);
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
  font-size: 14px;
}

.message-dropdown-title i {
  margin-right: 8px;
}

/* 列表体 */
.message-dropdown-body {
  max-height: 360px;
  overflow-y: auto;
  padding: 8px 0;
}

.message-loading,
.message-empty {
  padding: 40px 20px;
  text-align: center;
  color: #6c757d;
  font-size: 14px;
}

.message-loading i {
  font-size: 24px;
  margin-bottom: 8px;
}

.message-list {
  padding: 0 4px 4px;
}

.message-item {
  display: flex;
  padding: 10px 10px;
  cursor: pointer;
  border-radius: 8px;
  transition: background 0.15s ease;
}

.message-item:hover {
  background: #f8fafc;
}

.message-item.unread {
  background: #eef2ff;
}

.message-type-icon {
  width: 36px;
  height: 36px;
  border-radius: 12px;
  display: flex;
  align-items: center;
  justify-content: center;
  margin-right: 10px;
  background: #e5e7eb;
  color: #4b5563;
}

.message-type-icon.system {
  background: rgba(59, 130, 246, 0.12);
  color: #1d4ed8;
}
.message-type-icon.notification {
  background: rgba(234, 179, 8, 0.12);
  color: #b45309;
}
.message-type-icon.auto {
  background: rgba(16, 185, 129, 0.12);
  color: #047857;
}

.message-content-wrapper {
  flex: 1;
  min-width: 0;
}

.message-title {
  font-size: 14px;
  font-weight: 600;
  color: #111827;
  margin-bottom: 2px;
  white-space: nowrap;
  text-overflow: ellipsis;
  overflow: hidden;
}

.message-preview {
  font-size: 13px;
  color: #6b7280;
  margin-bottom: 4px;
  white-space: nowrap;
  text-overflow: ellipsis;
  overflow: hidden;
}

.message-time {
  font-size: 12px;
  color: #9ca3af;
}

/* 底部 */
.message-dropdown-footer {
  border-top: 1px solid #e5e7eb;
  padding: 8px 12px;
  text-align: center;
  background: #f9fafb;
}

.view-all-messages {
  display: inline-flex;
  align-items: center;
  justify-content: center;
  font-size: 13px;
  color: #4f46e5;
  text-decoration: none;
}

.view-all-messages:hover {
  text-decoration: underline;
}

/* 可以继续把 origin_project/css/message.css 剩余的 .chat-*, .message-center-* 等样式剪切进对应组件 */
</style>
