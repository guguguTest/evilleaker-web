<!-- src/components/FriendsDropdown.vue -->
<script setup>
import {computed, onMounted, onBeforeUnmount, ref, reactive} from 'vue';
import {useFriendsStore} from '@/stores/friends';
import {useAuthStore} from '@/stores/auth';
import {useChatStore} from '@/stores/chat';
import {useMessageStore} from '@/stores/messages';
import {useRouter} from 'vue-router';
import {showErrorMessage, showSuccessMessage} from '@/utils/messageBox';

const menu = reactive({ show:false, x:0, y:0, friend:null });
function openFriendMenu(friend, e) {
  menu.show = true;
  menu.friend = friend;
  menu.x = e.clientX;
  menu.y = e.clientY;
}
function hideFriendMenu() { menu.show = false; }
// close dropdown on outside click
const onDocClick = (e) => {
  if (!root.value) return;
  if (!root.value.contains(e.target)) {
    closeDropdown();
    hideFriendMenu();
  }
};
onMounted(() => {
  document.addEventListener('click', onDocClick);
});
onBeforeUnmount(() => {
  document.removeEventListener('click', onDocClick);
});

const root = ref(null);
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

const loading = computed(() => friendsStore.loading);
const friends = computed(() => friendsStore.friends);
const blacklist = computed(() => friendsStore.blacklist);
const requests = computed(() => friendsStore.requests);
const friendMessagesCount = computed(() => friendsStore.friendMessagesCount);

const activeTab = ref('friends'); // friends | blacklist | add
const searchQuery = ref('');
const searchResult = ref([]);
const searching = ref(false);

function toggleDropdown() {
  open.value = !open.value;
  if (open.value) {
    friendsStore.refreshAll().catch(() => {});
  }
}
function closeDropdown() {
  open.value = false;
}
const open = ref(false);

/* 省略其余业务方法（搜索/加好友/通过/拒绝等），保持原有逻辑不变 ... */

function openChat(friend) {
  messageStore.openConversationWithUser(friend);
  chatStore.openChatWithUser(friend);
  closeDropdown();
}

/* 其余：removeFriend、blockFriend、unblockFriend 等逻辑保持原样 ... */
</script>

<template>
  <div
      :class="[
      mobile ? 'friends-icon-wrapper-mobile' : 'friends-icon-wrapper',
    ]"
      ref="root"
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

          <div v-if="friends.length > 0" class="friends-list-container">
            <div
                v-for="friend in friends"
                :key="friend.id"
                class="friends-list-item"
                @click="openFriendMenu(friend, $event)"
            >
              <div class="avatar-wrap"><img class="friends-avatar" :src="friend.avatar" alt="" /><span class="friends-avatar-halo"></span></div>
              <div class="friends-user-info">
                <div class="friends-user-name">
                  {{ friend.nickname || friend.username }}
                </div>
                <div class="friends-user-uid">
                  UID: {{ friend.uid }}
                </div>
              </div>
              <div class="friends-list-actions hint">点击条目打开菜单</div>
            </div>
          </div>

          <div v-else class="friends-empty">
            <i class="fas fa-user-friends"></i>
            <p>暂无好友</p>
          </div>
        </template>

        <!-- 黑名单 tab / 添加好友 tab ...（保持你原来的逻辑） -->
      </div>

      <div class="friends-dropdown-footer">
        <button class="friends-more-btn" @click="goFriendMessagesCenter">
          <i class="fas fa-comments"></i>
          打开好友消息中心
        </button>
      </div>
    </div>

    <!-- 好友项点击后的小菜单 -->
    <ul v-if="menu.show" class="friend-menu" :style="{left: menu.x + 'px', top: menu.y + 'px'}" @click.stop>
      <li @click="openChat(menu.friend); hideFriendMenu()"><i class="fas fa-comment-dots"></i> 聊天</li>
      <li @click="removeFriend(menu.friend); hideFriendMenu()"><i class="fas fa-user-slash"></i> 删除</li>
      <li @click="blockFriend(menu.friend); hideFriendMenu()"><i class="fas fa-ban"></i> 拉黑</li>
    </ul>
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

.friends-icon.has-requests {
  color: #f39c12;
}

/* 角标 */
.friends-badge {
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

.friends-dropdown.show,
.friends-dropdown-mobile.show {
  opacity: 1;
  transform: translateY(0);
  pointer-events: auto;
}

/* 头部 */
.friends-dropdown-header {
  padding: 10px 14px;
  background: linear-gradient(135deg, #10b981, #059669);
  color: #fff;
}

.friends-dropdown-title {
  display: flex;
  align-items: center;
  gap: 8px;
  font-weight: 600;
}

/* tabs */
.friends-dropdown-tabs {
  display: flex;
  gap: 8px;
  padding: 8px 10px 0;
  background: #fff;
}

.friends-tab-btn {
  border: none;
  background: #f3f4f6;
  color: #374151;
  padding: 6px 10px;
  border-radius: 999px;
  cursor: pointer;
  font-weight: 600;
}

.friends-tab-btn.active {
  background: #10b981;
  color: #fff;
}

/* body */
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

/* 列表 */
.friends-list-container {
  display: flex;
  flex-direction: column;
  gap: 8px;
}

.friends-list-item {
  display: grid;
  grid-template-columns: 46px 1fr auto;
  gap: 10px;
  padding: 8px 10px;
  border-radius: 10px;
  background: #f9fafb;
  align-items: center;
  cursor: pointer;
}

.friends-list-item:hover {
  background: #f3f4f6;
}

.friends-user-info {
  min-width: 0;
}

.friends-user-name {
  font-weight: 600;
  color: #111827;
  overflow: hidden;
  text-overflow: ellipsis;
  white-space: nowrap;
}

.friends-user-uid {
  color: #9ca3af;
  font-size: 12px;
  margin-top: 2px;
}

.friends-list-actions.hint {
  color: #9ca3af;
  font-size: 12px;
}

/* 消息通知块 */
.friends-messages-notification {
  padding: 8px 10px;
  border-radius: 10px;
  background: #eef2ff;
  color: #4338ca;
  margin-bottom: 6px;
  cursor: pointer;
}

.friends-messages-notification-inner {
  display: flex;
  align-items: center;
  justify-content: space-between;
}

.friends-dropdown-footer {
  padding: 10px;
  border-top: 1px solid #f3f4f6;
  background: #fafafa;
}

.friends-more-btn {
  width: 100%;
  padding: 8px 10px;
  border: none;
  border-radius: 8px;
  background: #10b981;
  color: #fff;
  cursor: pointer;
  font-weight: 600;
}

.friends-more-btn:hover {
  background: #059669;
}

/* 动画 */
@keyframes pulse {
  0%, 100% { opacity: 1; }
  50% { opacity: 0.8; }
}

/* 修正：移动端定位，避免偏右出屏 */
@media (max-width: 768px) {
  .friends-dropdown-mobile {
    position: fixed;
    left: 8px;
    right: 8px;
    top: 56px;
    width: auto;
    max-width: none;
    transform: none;
  }
}
/* 好友项用户组背景与头像光环 */
.friends-list-item {
  position: relative;
}
.friends-list-item::before {
  content: "";
  position: absolute;
  inset: 0;
  background-image: var(--group-bg, none);
  background-size: cover;
  background-position: center;
  opacity: .12;
  border-radius: 10px;
  pointer-events: none;
}
.friends-avatar {
  position: relative;
  z-index: 1;
}
.friends-avatar-halo {
  position: absolute;
  top:-3px; left:-3px; width:46px; height:46px; border-radius:50%;
  background: conic-gradient(#ff0080,#ff0040,#ff4000,#ff8000,#ffbf00,#ffff00,#bfff00,#80ff00,#40ff00,#00ff00,#00ff40,#00ff80,#00ffbf,#00ffff,#00bfff,#0080ff,#0040ff,#0000ff,#4000ff,#8000ff,#bf00ff,#ff00ff,#ff00bf,#ff0080);
  filter: blur(2px);
  opacity: .6;
  z-index: 0;
}
/* 右键菜单 */
.friend-menu {
  position: fixed; z-index: 2000; background:#fff; border:1px solid #e5e7eb; border-radius:8px; padding:6px 0;
  box-shadow: 0 12px 30px rgba(15, 23, 42, .18);
}
.friend-menu > li { padding: 6px 14px; white-space: nowrap; cursor: pointer; }
.friend-menu > li:hover { background:#f5f7fa; }

.avatar-wrap { position: relative; width: 36px; height: 36px; margin-right: 10px; }
.avatar-wrap .friends-avatar { width: 36px; height: 36px; border-radius: 50%; object-fit: cover; }

/* 如果需要完整 1:1 样式，可继续从 origin_project/css/friends.css 复制剩余细节到这里 */
</style>
