<!-- src/views/MessageCenter.vue -->
<script setup>
import {onMounted, reactive, ref} from 'vue';
import {useMessageStore} from '@/stores/messages';
import {showErrorMessage, showSuccessMessage} from '@/utils/messageBox';

const messageStore = useMessageStore();

const state = reactive({
  selectedIds: [],
});
const loading = ref(false);

function isSelected(id) {
  return state.selectedIds.includes(id);
}

function toggleSelect(id) {
  if (state.selectedIds.includes(id)) {
    state.selectedIds = state.selectedIds.filter(x => x !== id);
  } else {
    state.selectedIds = [...state.selectedIds, id];
  }
}

function toggleSelectAll() {
  const allIds = messageStore.list.map(m => m.id);
  if (state.selectedIds.length === allIds.length) {
    state.selectedIds = [];
  } else {
    state.selectedIds = allIds;
  }
}

async function loadMore() {
  await messageStore.loadMessageList(false);
}

async function refresh() {
  loading.value = true;
  try {
    await messageStore.loadMessageList(true);
    await messageStore.refreshUnreadCount();
  } finally {
    loading.value = false;
  }
}

async function markRead(msg) {
  if (msg.is_read) return;
  try {
    await messageStore.markAsRead(msg.id);
  } catch (e) {
    showErrorMessage('标记已读失败');
  }
}

async function batchDelete() {
  if (!state.selectedIds.length) return;
  try {
    await messageStore.batchDelete(state.selectedIds);
    state.selectedIds = [];
    showSuccessMessage('删除成功');
  } catch (e) {
    showErrorMessage('删除失败');
  }
}

async function deleteOne(msg) {
  try {
    await messageStore.deleteOne(msg.id);
    state.selectedIds = state.selectedIds.filter(x => x !== msg.id);
    showSuccessMessage('删除成功');
  } catch (e) {
    showErrorMessage('删除失败');
  }
}

function formatTime(time) {
  if (!time) return '';
  return new Date(time).toLocaleString();
}

onMounted(() => {
  refresh();
});
</script>

<template>
  <div class="section message-center">
    <div class="message-center-header">
      <h1 class="message-center-title">
        <i class="fas fa-envelope-open-text me-2"></i>
        消息中心
      </h1>
      <div class="message-actions">
        <button class="message-btn message-btn-primary" @click="refresh">
          <i class="fas fa-sync-alt"></i>
          刷新
        </button>
        <button
            class="message-btn message-btn-danger"
            :disabled="!state.selectedIds.length"
            @click="batchDelete"
        >
          <i class="fas fa-trash-alt"></i>
          删除选中
        </button>
      </div>
    </div>

    <div class="message-center-body">
      <table class="message-table">
        <thead>
        <tr>
          <th width="40">
            <input
                type="checkbox"
                :checked="state.selectedIds.length === messageStore.list.length && messageStore.list.length > 0"
                @change="toggleSelectAll"
            />
          </th>
          <th width="70">类型</th>
          <th>标题</th>
          <th width="180">发送者</th>
          <th width="180">时间</th>
          <th width="120">操作</th>
        </tr>
        </thead>
        <tbody>
        <tr v-if="loading">
          <td colspan="6" class="message-center-loading">
            <i class="fas fa-spinner fa-spin"></i>
            加载中...
          </td>
        </tr>
        <tr v-else-if="!messageStore.list.length">
          <td colspan="6" class="message-center-empty">
            暂无消息
          </td>
        </tr>
        <tr
            v-for="msg in messageStore.list"
            :key="msg.id"
            :class="{ unread: !msg.is_read }"
        >
          <td>
            <input
                type="checkbox"
                :checked="isSelected(msg.id)"
                @change="toggleSelect(msg.id)"
            />
          </td>
          <td>
              <span class="message-type-badge" :data-type="msg.message_type">
                {{
                  msg.message_type === 'system'
                      ? '系统'
                      : msg.message_type === 'notification'
                          ? '通知'
                          : '用户'
                }}
              </span>
          </td>
          <td>
            <div class="message-title-cell">
              <span v-if="!msg.is_read" class="message-dot"></span>
              {{ msg.title || '无标题' }}
            </div>
          </td>
          <td>
            {{ msg.sender_name }}
          </td>
          <td>
            {{ formatTime(msg.created_at) }}
          </td>
          <td class="message-actions-cell">
            <button class="message-link" @click="markRead(msg)">
              标记已读
            </button>
            <button class="message-link danger" @click="deleteOne(msg)">
              删除
            </button>
          </td>
        </tr>
        </tbody>
      </table>

      <div
          v-if="messageStore.listHasMore && !loading && messageStore.list.length"
          class="message-center-footer"
      >
        <button class="message-btn message-btn-secondary" @click="loadMore">
          加载更多
        </button>
      </div>
    </div>
  </div>
</template>

<style scoped>
/* 样式参考 origin_project/css/message.css 的消息中心部分 */

.message-center-header {
  display: flex;
  align-items: center;
  justify-content: space-between;
  margin-bottom: 16px;
}

.message-center-title {
  font-size: 20px;
  font-weight: 600;
}

.message-actions {
  display: flex;
  gap: 8px;
}

.message-btn {
  border-radius: 999px;
  border: none;
  padding: 6px 14px;
  font-size: 13px;
  cursor: pointer;
}

.message-btn-primary {
  background: linear-gradient(135deg, #667eea, #764ba2);
  color: #fff;
}

.message-btn-secondary {
  background: #e5e7eb;
  color: #374151;
}

.message-btn-danger {
  background: #ef4444;
  color: #fff;
}

.message-center-body {
  background: #fff;
  border-radius: 12px;
  box-shadow: 0 12px 25px rgba(15, 23, 42, 0.08);
  padding: 12px;
}

.message-table {
  width: 100%;
  border-collapse: collapse;
  font-size: 13px;
}

.message-table th,
.message-table td {
  padding: 8px 6px;
  border-bottom: 1px solid #e5e7eb;
}

.message-table thead {
  background: #f3f4f6;
}

.message-center-loading,
.message-center-empty {
  text-align: center;
  padding: 30px 0;
  color: #6b7280;
}

.message-table tr.unread td {
  background: #eef2ff;
}

/* 类型 badge */
.message-type-badge {
  display: inline-block;
  padding: 2px 8px;
  border-radius: 999px;
  font-size: 12px;
  background: #e5e7eb;
}

.message-type-badge[data-type='system'] {
  background: #dbeafe;
  color: #1d4ed8;
}
.message-type-badge[data-type='notification'] {
  background: #fef3c7;
  color: #b45309;
}
.message-type-badge[data-type='user'] {
  background: #dcfce7;
  color: #15803d;
}

.message-title-cell {
  display: flex;
  align-items: center;
}

.message-dot {
  width: 8px;
  height: 8px;
  border-radius: 999px;
  background: #ef4444;
  margin-right: 6px;
}

/* 操作链接 */
.message-actions-cell {
  display: flex;
  gap: 6px;
}

.message-link {
  border: none;
  background: none;
  color: #4f46e5;
  font-size: 12px;
  cursor: pointer;
}

.message-link.danger {
  color: #b91c1c;
}

.message-center-footer {
  text-align: center;
  padding: 12px 0 4px;
}
</style>
