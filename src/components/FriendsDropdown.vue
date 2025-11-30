<template>
  <!-- 入口：好友图标按钮 -->
  <div class="friends-entry" :class="{ 'friends-entry--mobile': mobile }">
    <el-popover
        v-model:visible="visible"
        placement="bottom-end"
        width="320"
        :show-arrow="false"
        popper-class="friends-popover"
        trigger="click"
        @show="handleOpen"
        @hide="handleClose"
    >
      <!-- 触发器：好友图标 + 角标 -->
      <template #reference>
        <el-badge
            :value="requestCount"
            :max="99"
            v-if="requestCount > 0"
            class="friends-badge-icon"
        >
          <el-button circle text class="friends-icon-btn">
            <el-icon><UserFilled /></el-icon>
          </el-button>
        </el-badge>

        <el-button
            v-else
            circle
            text
            class="friends-icon-btn"
        >
          <el-icon><UserFilled /></el-icon>
        </el-button>
      </template>

      <!-- 弹窗内容：用 el-card 包一层，EP 风格 -->
      <el-card
          shadow="never"
          class="friends-card"
          body-class="friends-card-body"
      >
        <template #header>
          <div class="friends-card-header">
            <div class="friends-card-title">
              <el-icon><User /></el-icon>
              <span>好友</span>
            </div>
          </div>
        </template>

        <!-- Tabs 主体 -->
        <el-tabs v-model="activeTab" class="friends-tabs">
          <!-- 好友列表 Tab -->
          <el-tab-pane label="好友列表" name="friends">
            <div class="friends-tab-inner">
              <!-- 加载中 -->
              <div v-if="loading" class="friends-loading">
                <el-icon class="is-loading"><Loading /></el-icon>
                <span>加载中…</span>
              </div>

              <template v-else>
                <!-- 好友请求区 -->
                <section
                    v-if="requests && requests.length"
                    class="friends-section"
                >
                  <div class="section-header">
                    <span class="section-title">
                      好友请求（{{ requests.length }}）
                    </span>
                  </div>

                  <el-scrollbar
                      class="friends-requests-scroll"
                      max-height="150px"
                  >
                    <div
                        v-for="req in requests"
                        :key="req.id"
                        class="request-item"
                    >
                      <div class="request-main">
                        <el-avatar
                            :size="32"
                            :src="req.sender_avatar"
                            class="request-avatar"
                        >
                          {{ req.sender_nickname?.[0] || req.sender_name?.[0] || 'U' }}
                        </el-avatar>

                        <div class="request-info">
                          <div class="request-name">
                            {{ req.sender_nickname || req.sender_name }}
                          </div>
                          <div class="request-uid">
                            UID: {{ req.sender_uid }}
                          </div>
                          <div
                              v-if="req.message"
                              class="request-msg"
                          >
                            {{ req.message }}
                          </div>
                        </div>
                      </div>

                      <div class="request-actions">
                        <el-button
                            size="small"
                            type="primary"
                            @click="handleAcceptRequest(req)"
                        >
                          同意
                        </el-button>
                        <el-button
                            size="small"
                            @click="handleRejectRequest(req)"
                        >
                          拒绝
                        </el-button>
                      </div>
                    </div>
                  </el-scrollbar>
                </section>

                <!-- 好友列表 -->
                <section class="friends-section">
                  <div class="section-header">
                    <span class="section-title">我的好友</span>
                  </div>

                  <el-scrollbar
                      v-if="friends && friends.length"
                      class="friends-list-scroll"
                      max-height="230px"
                  >
                    <div
                        v-for="friend in friends"
                        :key="friend.id"
                        class="friend-row"
                    >
                      <el-avatar
                          :size="34"
                          :src="friend.avatar"
                          class="friend-avatar"
                      >
                        {{ friend.nickname?.[0] || friend.username?.[0] || 'U' }}
                      </el-avatar>

                      <div class="friend-main">
                        <div class="friend-name-line">
                          <span class="friend-name">
                            {{ friend.nickname || friend.username }}
                          </span>
                          <el-tag
                              v-if="isAdmin(friend)"
                              size="small"
                              type="warning"
                              class="friend-tag"
                          >
                            管理
                          </el-tag>
                          <span
                              class="friend-status-dot"
                              :class="isOnline(friend) ? 'online' : 'offline'"
                          ></span>
                        </div>
                        <div class="friend-uid">
                          UID: {{ friend.uid }}
                        </div>
                      </div>

                      <!-- 右侧操作菜单（Element Plus Dropdown） -->
                      <el-dropdown
                          trigger="click"
                          @command="cmd => handleFriendCommand(cmd, friend)"
                      >
                        <span class="friend-actions-trigger">
                          <el-icon><MoreFilled /></el-icon>
                        </span>
                        <template #dropdown>
                          <el-dropdown-menu>
                            <el-dropdown-item command="chat">
                              私信聊天
                            </el-dropdown-item>
                            <el-dropdown-item command="remove">
                              删除好友
                            </el-dropdown-item>
                            <el-dropdown-item command="block">
                              加入黑名单
                            </el-dropdown-item>
                          </el-dropdown-menu>
                        </template>
                      </el-dropdown>
                    </div>
                  </el-scrollbar>

                  <el-empty
                      v-else
                      description="暂无好友"
                      :image-size="60"
                  />
                </section>
              </template>
            </div>
          </el-tab-pane>

          <!-- 黑名单 Tab -->
          <el-tab-pane label="黑名单" name="blacklist">
            <div class="friends-tab-inner">
              <div v-if="loading" class="friends-loading">
                <el-icon class="is-loading"><Loading /></el-icon>
                <span>加载中…</span>
              </div>

              <template v-else>
                <el-scrollbar
                    v-if="blacklist && blacklist.length"
                    class="friends-list-scroll"
                    max-height="230px"
                >
                  <div
                      v-for="item in blacklist"
                      :key="item.id"
                      class="friend-row"
                  >
                    <el-avatar
                        :size="34"
                        :src="item.avatar"
                        class="friend-avatar"
                    >
                      {{ item.nickname?.[0] || item.username?.[0] || 'U' }}
                    </el-avatar>

                    <div class="friend-main">
                      <div class="friend-name-line">
                        <span class="friend-name">
                          {{ item.nickname || item.username }}
                        </span>
                        <span class="friend-status-text">已拉黑</span>
                      </div>
                      <div class="friend-uid">
                        UID: {{ item.uid }}
                      </div>
                    </div>

                    <el-button
                        size="small"
                        @click="handleUnblock(item)"
                    >
                      移出黑名单
                    </el-button>
                  </div>
                </el-scrollbar>

                <el-empty
                    v-else
                    description="黑名单为空"
                    :image-size="60"
                />
              </template>
            </div>
          </el-tab-pane>

          <!-- 添加好友 Tab：搜索 + 结果列表 -->
          <el-tab-pane label="添加好友" name="add">
            <div class="friends-tab-inner">
              <!-- 搜索区域 -->
              <el-form
                  class="add-friend-form"
                  @submit.prevent
              >
                <el-form-item>
                  <el-input
                      v-model="searchKeyword"
                      clearable
                      placeholder="输入 UID / 用户名 / 昵称"
                      @keyup.enter="handleSearch"
                  >
                    <template #prefix>
                      <el-icon><Search /></el-icon>
                    </template>
                  </el-input>
                </el-form-item>
                <el-form-item class="add-friend-actions">
                  <el-button
                      type="primary"
                      @click="handleSearch"
                  >
                    <el-icon class="btn-icon"><Search /></el-icon>
                    搜索
                  </el-button>
                </el-form-item>
              </el-form>

              <p class="add-friend-hint">
                搜索结果仅包含允许被搜索的用户。
              </p>

              <!-- 搜索结果列表 -->
              <section class="friends-section" v-if="searchResults && searchResults.length">
                <div class="section-header">
                  <span class="section-title">
                    搜索结果（{{ searchResults.length }}）
                  </span>
                </div>

                <el-scrollbar
                    class="friends-list-scroll"
                    max-height="230px"
                >
                  <div
                      v-for="user in searchResults"
                      :key="user.id"
                      class="friend-row"
                  >
                    <el-avatar
                        :size="34"
                        :src="user.avatar"
                        class="friend-avatar"
                    >
                      {{ user.nickname?.[0] || user.username?.[0] || 'U' }}
                    </el-avatar>

                    <div class="friend-main">
                      <div class="friend-name-line">
                        <span class="friend-name">
                          {{ user.nickname || user.username }}
                        </span>
                      </div>
                      <div class="friend-uid">
                        UID: {{ user.uid }}
                      </div>
                    </div>

                    <!-- 对搜索结果的操作菜单：添加好友 / 加入黑名单 -->
                    <el-dropdown
                        trigger="click"
                        @command="cmd => handleSearchUserCommand(cmd, user)"
                    >
                      <span class="friend-actions-trigger">
                        <el-icon><MoreFilled /></el-icon>
                      </span>
                      <template #dropdown>
                        <el-dropdown-menu>
                          <el-dropdown-item command="add">
                            添加好友
                          </el-dropdown-item>
                          <el-dropdown-item command="block">
                            加入黑名单
                          </el-dropdown-item>
                        </el-dropdown-menu>
                      </template>
                    </el-dropdown>
                  </div>
                </el-scrollbar>
              </section>

              <el-empty
                  v-else
                  description="暂无搜索结果"
                  :image-size="50"
              />
            </div>
          </el-tab-pane>
        </el-tabs>
      </el-card>
    </el-popover>
  </div>
</template>

<script setup>
import { ref, computed, onMounted } from 'vue'
import { storeToRefs } from 'pinia'
import { useFriendsStore } from '@/stores/friends'
import { useChatStore } from '@/stores/chat'

// Element Plus 图标
import {
  UserFilled,
  User,
  MoreFilled,
  Loading,
  Search,
} from '@element-plus/icons-vue'

const props = defineProps({
  mobile: {
    type: Boolean,
    default: false,
  },
})

// Pinia stores
const friendsStore = useFriendsStore()
const chatStore = useChatStore()

// 从 storeToRefs 里取出 state（名字与 src/stores/friends.js 对应）
const {
  friends,
  blacklist,
  requests,
  loading,
  activeTab,
  searchKeyword,
  searchResults,
} = storeToRefs(friendsStore)

// 弹窗可见性
const visible = ref(false)

// 请求数量
const requestCount = computed(() => (requests.value ? requests.value.length : 0))

// 打开弹窗时刷新全部数据 —— 使用 friends.js 里的 refreshAll
const handleOpen = () => {
  if (typeof friendsStore.refreshAll === 'function') {
    friendsStore.refreshAll()
  }
}

// 关闭弹窗时：还原到好友列表 + 清空搜索
const handleClose = () => {
  // 优先使用 store 的 setter，如果没有就直接改 ref
  if (typeof friendsStore.setActiveTab === 'function') {
    friendsStore.setActiveTab('friends')
  } else {
    activeTab.value = 'friends'
  }
  clearSearchState()
}

// 初次挂载时也拉一次，避免第一次打开是空
onMounted(() => {
  handleOpen()
})

// 清空搜索相关 state（尽量通过 action，不直接改 state）
const clearSearchState = () => {
  if (typeof friendsStore.clearSearch === 'function') {
    friendsStore.clearSearch()
  } else {
    searchKeyword.value = ''
    searchResults.value = []
  }
}

// ===== 好友请求相关 =====
const handleAcceptRequest = (req) => {
  if (typeof friendsStore.acceptRequest === 'function') {
    friendsStore.acceptRequest(req.id)
  }
}

const handleRejectRequest = (req) => {
  if (typeof friendsStore.rejectRequest === 'function') {
    friendsStore.rejectRequest(req.id)
  }
}

// ===== 搜索用户 =====
const handleSearch = () => {
  const q = (searchKeyword.value || '').trim()
  if (!q) return
  if (typeof friendsStore.performSearch === 'function') {
    friendsStore.performSearch()
  }
}

// ===== 搜索结果行：添加好友 / 拉黑 =====
const handleSearchUserCommand = (command, user) => {
  if (!user) return
  switch (command) {
    case 'add':
      if (typeof friendsStore.sendRequestTo === 'function') {
        friendsStore.sendRequestTo(user.id)
      }
      // 发送完请求后清空搜索状态
      clearSearchState()
      break
    case 'block':
      if (typeof friendsStore.blockUser === 'function') {
        friendsStore.blockUser(user.id)
      }
      // 拉黑后也清空搜索状态
      clearSearchState()
      break
    default:
      break
  }
}

// ===== 黑名单操作 =====
const handleUnblock = (item) => {
  if (typeof friendsStore.unblockUser === 'function') {
    friendsStore.unblockUser(item.id)
  }
}

// ===== 好友行操作菜单 =====
const handleFriendCommand = (command, friend) => {
  if (!friend) return

  switch (command) {
    case 'chat':
      if (typeof chatStore.openChatWithUser === 'function') {
        chatStore.openChatWithUser(friend)
      }
      break
    case 'remove':
      if (typeof friendsStore.removeFriendById === 'function') {
        friendsStore.removeFriendById(friend.id)
      }
      break
    case 'block':
      if (typeof friendsStore.blockUser === 'function') {
        friendsStore.blockUser(friend.id)
      }
      break
    default:
      break
  }
}

// ===== 展示辅助函数（不直接改 store） =====
const isOnline = (friend) => {
  return friend?.online === true || friend?.status === 'online'
}

const isAdmin = (friend) => {
  return friend?.user_rank === 'admin' || friend?.isAdmin === true
}
</script>

<style scoped>
/* 入口按钮 */
.friends-entry {
  display: inline-flex;
  align-items: center;
  position: relative;
}
.friends-entry--mobile {
  margin-right: 4px;
}
.friends-icon-btn {
  font-size: 18px;
  padding: 4px;
}

/* 角标大小微调 */
.friends-badge-icon {
  --el-badge-size: 16px;
}

/* Popover 容器：去掉 padding 和外框，收紧白边 */
:deep(.friends-popover) {
  padding: 0 !important;
  border-radius: 6px;
  border: none;
}
:deep(.friends-popover .el-popover__content) {
  padding: 0 !important;
}

/* Card 本体：紧凑风格 */
.friends-card {
  border-radius: 6px;
  border: none;
  box-shadow: none;
}
.friends-card-header {
  display: flex;
  align-items: center;
  justify-content: space-between;
}
.friends-card-title {
  display: inline-flex;
  align-items: center;
  gap: 4px;
  font-weight: 600;
  font-size: 13px;
}
/* 压缩 header 和 body 的默认 padding */
:deep(.friends-card .el-card__header) {
  padding: 6px 8px;
}
.friends-card-body {
  padding: 0; /* 内边距交给 tabs 控制 */
}

/* Tabs 样式，收缩一点边距 */
.friends-tabs :deep(.el-tabs__header) {
  margin: 0;
  padding: 0 6px;
  border-bottom: 1px solid #ebeef5;
}
.friends-tabs :deep(.el-tabs__nav-wrap::after) {
  display: none;
}
.friends-tabs :deep(.el-tabs__item) {
  padding: 0 8px;
  font-size: 12px;
}

/* Tab 内容内边距 */
.friends-tab-inner {
  padding: 6px 8px 8px;
}

/* 加载中 */
.friends-loading {
  display: flex;
  align-items: center;
  justify-content: center;
  gap: 6px;
  padding: 16px 0;
  color: #909399;
  font-size: 12px;
}

/* 分组（请求 / 列表） */
.friends-section + .friends-section {
  margin-top: 4px;
  border-top: 1px solid #f2f2f2;
  padding-top: 4px;
}
.section-header {
  display: flex;
  align-items: center;
  justify-content: space-between;
  margin-bottom: 3px;
}
.section-title {
  font-size: 12px;
  font-weight: 500;
  color: #606266;
}

/* 滚动区域 */
.friends-requests-scroll {
  max-height: 150px;
}
.friends-list-scroll {
  max-height: 230px;
}

/* 单条好友请求 */
.request-item {
  padding: 5px 3px;
  border-radius: 6px;
  background: #f9fafb;
  margin-bottom: 3px;
}
.request-main {
  display: flex;
  align-items: flex-start;
  gap: 6px;
}
.request-avatar {
  flex-shrink: 0;
}
.request-info {
  flex: 1;
  min-width: 0;
}
.request-name {
  font-size: 13px;
  font-weight: 500;
  color: #303133;
}
.request-uid {
  font-size: 11px;
  color: #909399;
}
.request-msg {
  margin-top: 2px;
  font-size: 12px;
  color: #606266;
  word-break: break-all;
}
.request-actions {
  margin-top: 4px;
  display: flex;
  justify-content: flex-end;
  gap: 6px;
}

/* 好友 / 搜索结果行 */
.friend-row {
  display: flex;
  align-items: center;
  padding: 5px 3px;
  border-radius: 6px;
  cursor: default;
  transition: background 0.15s ease;
}
.friend-row + .friend-row {
  margin-top: 2px;
}
.friend-row:hover {
  background: #f5f7fa;
}
.friend-avatar {
  flex-shrink: 0;
  margin-right: 6px;
}
.friend-main {
  flex: 1;
  min-width: 0;
}
.friend-name-line {
  display: flex;
  align-items: center;
  gap: 6px;
}
.friend-name {
  font-size: 13px;
  font-weight: 500;
  color: #303133;
}
.friend-tag {
  line-height: 1;
}
.friend-uid {
  font-size: 11px;
  color: #909399;
  margin-top: 1px;
}

/* 在线状态点 */
.friend-status-dot {
  width: 8px;
  height: 8px;
  border-radius: 50%;
  margin-left: auto;
}
.friend-status-dot.online {
  background: #67c23a;
}
.friend-status-dot.offline {
  background: #c0c4cc;
}

/* 黑名单状态文字 */
.friend-status-text {
  font-size: 12px;
  color: #f56c6c;
}

/* 右侧操作菜单触发图标 */
.friend-actions-trigger {
  display: inline-flex;
  align-items: center;
  justify-content: center;
  padding: 4px;
  color: #909399;
  cursor: pointer;
}
.friend-actions-trigger:hover {
  color: #606266;
}

/* 添加好友区域 */
.add-friend-form {
  margin-top: 2px;
}
.add-friend-actions {
  margin-bottom: 0;
}
.btn-icon {
  margin-right: 4px;
}
.add-friend-hint {
  margin-top: 2px;
  font-size: 11px;
  color: #909399;
}
</style>
