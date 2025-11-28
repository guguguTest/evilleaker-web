<!-- src/components/FriendsDropdown.vue -->
<script setup>
import {computed, onMounted, ref} from 'vue';
import {useFriendsStore} from '@/stores/friends';
import {useAuthStore} from '@/stores/auth';
import {useChatStore} from '@/stores/chat';
import {useMessageStore} from '@/stores/messages';
import {useRouter} from 'vue-router';
import {showErrorMessage, showSuccessMessage} from '@/utils/messageBox';

const props = defineProps({
  mobile: {
    type: Boolean,
    default: false,
  },
});

const friendsStore = useFriendsStore();
const authStore = useAuthStore();
const chatStore = useChatStore();
const messageStore = useMessageStore();
const router = useRouter();

const open = ref(false);
const activeTab = computed({
  get: () => friendsStore.activeTab,
  set: (val) => friendsStore.setActiveTab(val),
});

const loading = computed(() => friendsStore.loading);
const friends = computed(() => friendsStore.friends);
const blacklist = computed(() => friendsStore.blacklist);
const requests = computed(() => friendsStore.requests);
const searchKeyword = computed({
  get: () => friendsStore.searchKeyword,
  set: (val) => friendsStore.setSearchKeyword(val),
});
const searchResults = computed(() => friendsStore.searchResults);

const friendMessagesCount = computed(() => messageStore.unreadCount); // 简化：使用未读消息数

function toggleDropdown() {
  if (!authStore.token) {
    router.push('/login');
    return;
  }
  open.value = !open.value;
  if (open.value) {
    friendsStore.refreshAll().catch(() => {});
    messageStore.refreshUnreadCount().catch(() => {});
  }
}

function closeDropdown() {
  open.value = false;
}

function openChat(friend) {
  closeDropdown();
  chatStore.openChatWithUser(friend);
}

async function removeFriend(friend) {
  try {
    await friendsStore.removeFriendById(friend.id);
    showSuccessMessage('已删除好友');
  } catch (e) {
    showErrorMessage('删除好友失败');
  }
}

async function blockFriend(friend) {
  try {
    await friendsStore.blockUser(friend.id);
    showSuccessMessage('已加入黑名单');
  } catch (e) {
    showErrorMessage('加入黑名单失败');
  }
}

async function unblockUser(user) {
  try {
    await friendsStore.unblockUser(user.id);
    showSuccessMessage('已从黑名单移除');
  } catch (e) {
    showErrorMessage('移除失败');
  }
}

async function handleSearch() {
  await friendsStore.performSearch();
}

async function sendFriendRequestTo(user) {
  try {
    await friendsStore.sendRequestTo(user.id);
    showSuccessMessage('好友请求已发送');
  } catch (e) {
    showErrorMessage('发送好友请求失败');
  }
}

async function acceptRequest(request) {
  try {
    await friendsStore.acceptRequest(request.id);
    showSuccessMessage('已通过好友请求');
  } catch (e) {
    showErrorMessage('操作失败');
  }
}

async function rejectRequest(request) {
  try {
    await friendsStore.rejectRequest(request.id);
    showSuccessMessage('已拒绝好友请求');
  } catch (e) {
    showErrorMessage('操作失败');
  }
}

function goFriendMessagesCenter() {
  closeDropdown();
  router.push('/message-center');
}

onMounted(() => {
  if (authStore.token) {
    friendsStore.refreshAll().catch(() => {});
  }
});
</script>

<template>
  <div
      :class="[
      mobile ? 'friends-icon-wrapper-mobile' : 'friends-icon-wrapper',
    ]"
      @mouseleave="closeDropdown"
  >
    <i class="fas fa-user-friends friends-icon" @click.stop="toggleDropdown"></i>
    <span
        v-if="requests.length > 0 || friendMessagesCount > 0"
        class="friends-badge"
    >
      {{
        (requests.length + friendMessagesCount) > 99
            ? '99+'
            : (requests.length + friendMessagesCount)
      }}
    </span>

    <div
        :class="[
        mobile ? 'friends-dropdown-mobile' : 'friends-dropdown',
        { show: open },
      ]"
        @click.stop
    >
      <div class="friends-dropdown-header">
        <div class="friends-dropdown-title">
          <i class="fas fa-user-friends"></i>
          <span>好友</span>
        </div>
      </div>

      <div class="friends-dropdown-tabs">
        <button
            class="friends-tab-btn"
            :class="{ active: activeTab === 'friends' }"
            @click="activeTab = 'friends'"
        >
          好友
        </button>
        <button
            class="friends-tab-btn"
            :class="{ active: activeTab === 'blacklist' }"
            @click="activeTab = 'blacklist'"
        >
          黑名单
        </button>
        <button
            class="friends-tab-btn"
            :class="{ active: activeTab === 'add' }"
            @click="activeTab = 'add'"
        >
          添加好友
        </button>
      </div>

      <div class="friends-dropdown-body">
        <div v-if="loading" class="friends-loading">
          <i class="fas fa-spinner fa-spin"></i>
          <p>加载中...</p>
        </div>

        <!-- 好友 tab -->
        <template v-else-if="activeTab === 'friends'">
          <div
              v-if="friendMessagesCount > 0"
              class="friends-messages-notification"
              @click="goFriendMessagesCenter"
          >
            <div class="friends-messages-notification-inner">
              <div class="left">
                <i class="fas fa-envelope"></i>
                <span>您有 {{ friendMessagesCount }} 条好友未读消息</span>
              </div>
              <i class="fas fa-chevron-right"></i>
            </div>
          </div>

          <div v-if="requests.length" class="friends-group">
            <div class="friends-group-header">
              <div class="friends-group-title">
                <i class="fas fa-user-clock"></i>
                <span>好友请求</span>
                <span class="friends-group-count">{{ requests.length }}</span>
              </div>
            </div>
            <div class="friends-group-content">
              <div
                  v-for="request in requests"
                  :key="request.id"
                  class="friends-request-item"
              >
                <img
                    class="friends-avatar"
                    :src="request.sender_avatar"
                    alt=""
                />
                <div class="friends-user-info">
                  <div class="friends-user-name">
                    {{ request.sender_nickname || request.sender_username }}
                  </div>
                  <div class="friends-user-uid">
                    UID: {{ request.sender_uid }}
                  </div>
                </div>
                <div class="friends-request-actions">
                  <button
                      class="friends-btn primary"
                      @click="acceptRequest(request)"
                  >
                    接受
                  </button>
                  <button
                      class="friends-btn ghost"
                      @click="rejectRequest(request)"
                  >
                    拒绝
                  </button>
                </div>
              </div>
            </div>
          </div>

          <div v-if="friends.length" class="friends-list-container">
            <div
                v-for="friend in friends"
                :key="friend.id"
                class="friends-list-item"
            >
              <img class="friends-avatar" :src="friend.avatar" alt="" />
              <div class="friends-user-info">
                <div class="friends-user-name">
                  {{ friend.nickname || friend.username }}
                </div>
                <div class="friends-user-uid">
                  UID: {{ friend.uid }}
                </div>
              </div>
              <div class="friends-list-actions">
                <button class="friends-btn primary" @click="openChat(friend)">
                  <i class="fas fa-comment-alt"></i>
                  聊天
                </button>
                <button class="friends-btn ghost" @click="removeFriend(friend)">
                  删除
                </button>
                <button class="friends-btn ghost" @click="blockFriend(friend)">
                  拉黑
                </button>
              </div>
            </div>
          </div>

          <div v-else class="friends-empty">
            <i class="fas fa-user-friends"></i>
            <p>暂无好友</p>
          </div>
        </template>

        <!-- 黑名单 tab -->
        <template v-else-if="activeTab === 'blacklist'">
          <div v-if="blacklist.length" class="friends-list-container">
            <div
                v-for="user in blacklist"
                :key="user.id"
                class="friends-list-item"
            >
              <img class="friends-avatar" :src="user.avatar" alt="" />
              <div class="friends-user-info">
                <div class="friends-user-name">
                  {{ user.nickname || user.username }}
                </div>
                <div class="friends-user-uid">UID: {{ user.uid }}</div>
              </div>
              <div class="friends-list-actions">
                <button class="friends-btn primary" @click="unblockUser(user)">
                  <i class="fas fa-unlock-alt"></i>
                  解除
                </button>
              </div>
            </div>
          </div>
          <div v-else class="friends-empty">
            <i class="fas fa-ban"></i>
            <p>黑名单为空</p>
          </div>
        </template>

        <!-- 添加好友 tab -->
        <template v-else-if="activeTab === 'add'">
          <div class="friends-search">
            <i class="fas fa-search friends-search-icon"></i>
            <input
                v-model="searchKeyword"
                class="friends-search-input"
                placeholder="搜索 UID、用户名或昵称..."
                @keyup.enter="handleSearch"
            />
            <button class="friends-btn primary" @click="handleSearch">
              搜索
            </button>
          </div>

          <div v-if="searchResults.length" class="friends-search-results">
            <div
                v-for="user in searchResults"
                :key="user.id"
                class="friends-search-item"
            >
              <img class="friends-avatar" :src="user.avatar" alt="" />
              <div class="friends-user-info">
                <div class="friends-user-name">
                  {{ user.nickname || user.username }}
                </div>
                <div class="friends-user-uid">UID: {{ user.uid }}</div>
              </div>
              <div class="friends-search-actions">
                <button
                    class="friends-btn primary"
                    @click="sendFriendRequestTo(user)"
                >
                  <i class="fas fa-user-plus"></i>
                  加好友
                </button>
              </div>
            </div>
          </div>
          <div v-else class="friends-empty">
            <i class="fas fa-search"></i>
            <p>输入 UID / 用户名 / 昵称 搜索用户</p>
          </div>
        </template>
      </div>
    </div>
  </div>
</template>

<style scoped>
/* 关键样式来自 origin_project/css/friends.css */

/* 图标 */
.friends-icon-wrapper,
.friends-icon-wrapper-mobile {
  position: relative;
  display: inline-block;
  margin-right: 8px;
}

.friends-icon {
  font-size: 1.2rem;
  color: #6c757d;
  cursor: pointer;
  transition: color 0.3s ease;
}

.friends-icon:hover {
  color: #667eea;
}

/* 角标 */
.friends-badge {
  position: absolute;
  top: -8px;
  right: -8px;
  background: linear-gradient(135deg, #f39c12, #e67e22);
  color: white;
  border-radius: 10px;
  padding: 2px 6px;
  font-size: 11px;
  font-weight: 600;
  min-width: 18px;
  text-align: center;
  display: inline-block;
}

/* 下拉 */
.friends-dropdown,
.friends-dropdown-mobile {
  position: absolute;
  top: 100%;
  right: 0;
  width: 380px;
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

.friends-dropdown-mobile {
  right: auto;
  left: -140px;
  width: calc(100vw - 32px);
}

.friends-dropdown.show,
.friends-dropdown-mobile.show {
  opacity: 1;
  transform: translateY(0);
  pointer-events: auto;
}

/* 头部 + tabs */
.friends-dropdown-header {
  padding: 10px 14px;
  background: linear-gradient(135deg, #667eea, #764ba2);
  color: #fff;
}

.friends-dropdown-title {
  display: flex;
  align-items: center;
  font-size: 14px;
}

.friends-dropdown-title i {
  margin-right: 8px;
}

.friends-dropdown-tabs {
  display: flex;
  padding: 6px 8px;
  background: #f3f4f6;
  gap: 6px;
}

.friends-tab-btn {
  flex: 1;
  border: none;
  border-radius: 999px;
  background: transparent;
  font-size: 13px;
  padding: 6px 8px;
  cursor: pointer;
  color: #4b5563;
}

.friends-tab-btn.active {
  background: #fff;
  color: #4f46e5;
  box-shadow: 0 1px 3px rgba(15, 23, 42, 0.1);
}

/* 内容区 */
.friends-dropdown-body {
  padding: 6px 8px 10px;
  max-height: 380px;
  overflow-y: auto;
}

.friends-loading {
  padding: 40px 20px;
  text-align: center;
  color: #6c757d;
}

.friends-empty {
  padding: 40px 20px;
  text-align: center;
  color: #6c757d;
  font-size: 14px;
}

.friends-empty i {
  font-size: 32px;
  margin-bottom: 10px;
}

/* 公用 item */
.friends-list-container {
  display: flex;
  flex-direction: column;
  gap: 8px;
}

.friends-list-item,
.friends-request-item,
.friends-search-item {
  display: flex;
  align-items: center;
  padding: 8px 10px;
  border-radius: 10px;
  background: #f9fafb;
  transition: background 0.15s ease;
}

.friends-list-item:hover,
.friends-request-item:hover,
.friends-search-item:hover {
  background: #eef2ff;
}

.friends-avatar {
  width: 36px;
  height: 36px;
  border-radius: 999px;
  object-fit: cover;
  margin-right: 10px;
}

.friends-user-info {
  flex: 1;
  min-width: 0;
}

.friends-user-name {
  font-size: 14px;
  font-weight: 600;
  color: #111827;
  white-space: nowrap;
  text-overflow: ellipsis;
  overflow: hidden;
}

.friends-user-uid {
  font-size: 12px;
  color: #9ca3af;
}

/* 按钮 */
.friends-btn {
  border-radius: 999px;
  padding: 4px 8px;
  font-size: 12px;
  border: none;
  cursor: pointer;
  white-space: nowrap;
}

.friends-btn.primary {
  background: linear-gradient(135deg, #667eea, #764ba2);
  color: #fff;
}

.friends-btn.ghost {
  background: #e5e7eb;
  color: #374151;
}

.friends-list-actions,
.friends-request-actions,
.friends-search-actions {
  display: flex;
  flex-direction: column;
  gap: 4px;
  margin-left: 8px;
}

/* 好友请求分组 */
.friends-group {
  margin-bottom: 8px;
  border-radius: 10px;
  background: #f9fafb;
  padding: 6px 6px 8px;
}

.friends-group-header {
  display: flex;
  align-items: center;
  justify-content: space-between;
  padding: 4px 6px 6px;
}

.friends-group-title {
  display: flex;
  align-items: center;
  gap: 8px;
  font-size: 13px;
  font-weight: 600;
}

.friends-group-count {
  font-size: 11px;
  background: #fee2e2;
  color: #b91c1c;
  padding: 2px 6px;
  border-radius: 999px;
}

/* 好友消息提示框 */
.friends-messages-notification {
  border-radius: 10px;
  background: #eef2ff;
  padding: 10px 12px;
  margin-bottom: 8px;
  cursor: pointer;
  animation: pulse 2s infinite;
}

.friends-messages-notification-inner {
  display: flex;
  align-items: center;
  justify-content: space-between;
}

.friends-messages-notification-inner .left {
  display: flex;
  align-items: center;
  gap: 8px;
}

.friends-messages-notification-inner i {
  color: #4f46e5;
}

/* 搜索 */
.friends-search {
  display: flex;
  align-items: center;
  background: #f9fafb;
  border-radius: 999px;
  padding: 4px 8px;
  margin-bottom: 8px;
}

.friends-search-icon {
  color: #9ca3af;
  margin-right: 4px;
}

.friends-search-input {
  flex: 1;
  border: none;
  outline: none;
  background: transparent;
  font-size: 13px;
}

/* 动画 */
@keyframes pulse {
  0%, 100% {
    opacity: 1;
  }
  50% {
    opacity: 0.8;
  }
}

/* 如果需要完整 1:1 样式，可以把 origin_project/css/friends.css 剩余选择器继续粘到这里 */
</style>
