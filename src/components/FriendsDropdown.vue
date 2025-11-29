<!-- src/components/FriendsDropdown.vue -->
<script setup>
import {computed, onMounted, onBeforeUnmount, ref, reactive} from 'vue'
import {useFriendsStore} from '@/stores/friends'
import {useAuthStore} from '@/stores/auth'
import {useChatStore} from '@/stores/chat'
import {useMessageStore} from '@/stores/messages'
import {showErrorMessage, showSuccessMessage} from '@/utils/messageBox'

const props = defineProps({
  mobile: { type: Boolean, default: false }
})

const root = ref(null)
const open = ref(false)
const activeTab = ref('friends') // friends | blacklist | add

const friendsStore = useFriendsStore()
const authStore = useAuthStore()
const chatStore = useChatStore()
const messageStore = useMessageStore()

const loading = computed(() => friendsStore.loading)
const friends = computed(() => friendsStore.friends || [])          // 防御
const blacklist = computed(() => friendsStore.blacklist || [])      // 防御
const requests = computed(() => friendsStore.requests || [])        // 防御

// 右键/点击菜单
const menu = reactive({ show:false, x:0, y:0, friend:null })
function openFriendMenu(friend, e) {
  menu.show = true
  menu.friend = friend
  menu.x = e.clientX
  menu.y = e.clientY
}
function hideFriendMenu(){ menu.show = false }

// 只给管理员显示光环（按你的真实字段改：is_admin / role / user_group 等）
function isAdmin(user) {
  return !!(user?.is_admin || user?.role === 'admin' || user?.user_group === 'admin')
}
function isOnline(user) {
  return !!user?.online
}

function toggleDropdown() {
  open.value = !open.value
  if (open.value) {
    friendsStore.refreshAll?.().catch(() => {})
  }
}
function closeDropdown() { open.value = false }

const onDocClick = (e) => {
  if (!root.value) return
  if (!root.value.contains(e.target)) {
    closeDropdown()
    hideFriendMenu()
  }
}
onMounted(() => document.addEventListener('click', onDocClick))
onBeforeUnmount(() => document.removeEventListener('click', onDocClick))

function openChat(friend) {
  messageStore.openConversationWithUser(friend)
  chatStore.openChatWithUser(friend)
  closeDropdown()
}

async function removeFriend(friend) {
  try {
    await friendsStore.removeFriend(friend.id)
    showSuccessMessage('已删除好友')
  } catch { showErrorMessage('删除失败') }
}

async function blockFriend(friend) {
  try {
    await friendsStore.blockFriend(friend.id)
    showSuccessMessage('已加入黑名单')
  } catch { showErrorMessage('操作失败') }
}

async function unblockFriend(item) {
  try {
    await friendsStore.unblockFriend(item.id)
    showSuccessMessage('已移出黑名单')
  } catch { showErrorMessage('操作失败') }
}

/** 添加好友 */
const addKeyword = ref('')
async function addFriend() {
  const kw = addKeyword.value.trim()
  if (!kw) return showErrorMessage('请输入用户名或UID')
  try {
    // 你的 store 里方法名如果不同，就在这里换成对应的
    if (friendsStore.addFriend) await friendsStore.addFriend(kw)
    else if (friendsStore.addFriendByKeyword) await friendsStore.addFriendByKeyword(kw)
    else throw new Error('addFriend API missing')
    showSuccessMessage('请求已发送')
    addKeyword.value = ''
  } catch {
    showErrorMessage('发送请求失败')
  }
}
</script>

<template>
  <div :class="[props.mobile ? 'friends-icon-wrapper-mobile' : 'friends-icon-wrapper']" ref="root">
    <i class="fas fa-user-friends friends-icon" @click.stop="toggleDropdown"></i>
    <span v-if="(requests.length) > 0" class="friends-badge">{{ (requests.length) > 99 ? '99+' : requests.length }}</span>

    <div :class="[props.mobile ? 'friends-dropdown-mobile' : 'friends-dropdown', { show: open }]" @click.stop>
      <div class="friends-dropdown-header">
        <div class="friends-dropdown-title"><i class="fas fa-user-friends"></i><span>好友</span></div>
      </div>

      <div class="friends-dropdown-tabs">
        <button class="friends-tab-btn" :class="{ active: activeTab === 'friends' }" @click="activeTab='friends'">好友</button>
        <button class="friends-tab-btn" :class="{ active: activeTab === 'blacklist' }" @click="activeTab='blacklist'">黑名单</button>
        <button class="friends-tab-btn" :class="{ active: activeTab === 'add' }" @click="activeTab='add'">添加好友</button>
      </div>

      <div class="friends-dropdown-body">
        <div v-if="loading" class="friends-loading">
          <i class="fas fa-spinner fa-spin"></i><p>加载中...</p>
        </div>

        <!-- 好友 -->
        <template v-else-if="activeTab === 'friends'">
          <div v-if="friends.length > 0" class="friends-list-container">
            <div
                v-for="friend in friends"
                :key="friend.id"
                class="friends-list-item"
                :style="{ '--group-bg': isAdmin(friend) && friend.group_bg ? `url(${friend.group_bg})` : 'none' }"
                @click="openFriendMenu(friend, $event)"
            >
              <div class="avatar-wrap">
                <img class="friends-avatar" :src="friend.avatar" alt="" />
                <span v-if="isAdmin(friend)" class="friends-avatar-halo"></span>
                <span :class="['presence-dot', isOnline(friend) ? 'online' : 'offline']"></span>
              </div>
              <div class="friends-user-info">
                <div class="friends-user-name">{{ friend.nickname || friend.username }}</div>
                <div class="friends-user-uid">UID: {{ friend.uid }}</div>
              </div>
              <div class="friends-list-actions hint">点击打开菜单</div>
            </div>
          </div>
          <div v-else class="friends-empty">
            <i class="fas fa-user-friends"></i><p>暂无好友</p>
          </div>
        </template>

        <!-- 黑名单 -->
        <template v-else-if="activeTab === 'blacklist'">
          <div v-if="blacklist.length > 0" class="friends-list-container">
            <div v-for="item in blacklist" :key="item.id" class="friends-list-item">
              <div class="avatar-wrap">
                <img class="friends-avatar" :src="item.avatar" alt="" />
                <span class="presence-dot offline"></span>
              </div>
              <div class="friends-user-info">
                <div class="friends-user-name">{{ item.nickname || item.username }}</div>
                <div class="friends-user-uid">UID: {{ item.uid }}</div>
              </div>
              <div class="friends-list-actions">
                <button class="friends-btn" @click.stop="unblockFriend(item)">移出黑名单</button>
              </div>
            </div>
          </div>
          <div v-else class="friends-empty"><i class="fas fa-ban"></i><p>黑名单为空</p></div>
        </template>

        <!-- 添加好友 -->
        <template v-else>
          <div class="add-friend-box">
            <input v-model="addKeyword" class="add-friend-input" placeholder="输入用户名或UID" />
            <button class="friends-btn primary" @click="addFriend">发送请求</button>
          </div>
        </template>
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
.friends-icon-wrapper, .friends-icon-wrapper-mobile { position: relative; display: inline-block; margin-right: 8px; }
.friends-icon { font-size: 1.2rem; color: #6c757d; cursor: pointer; transition: color .3s; }
.friends-icon:hover { color: #667eea; }

.friends-badge {
  position: absolute; right: -2px; top: -2px; padding: 0 6px; border-radius: 10px;
  background: #ef4444; color: #fff; font-size: 12px; line-height: 18px; font-weight: 600; min-width: 18px; text-align: center;
}

.friends-dropdown, .friends-dropdown-mobile {
  position: absolute; top: 100%; right: 0; width: 380px; max-height: 480px;
  background: #fff; border-radius: 12px; box-shadow: 0 12px 30px rgba(15,23,42,.28);
  margin-top: 8px; overflow: hidden; opacity: 0; transform: translateY(8px); pointer-events: none;
  transition: opacity .2s ease, transform .2s ease; z-index: 1200;
}
.friends-dropdown.show, .friends-dropdown-mobile.show { opacity: 1; transform: translateY(0); pointer-events: auto; }
@media (max-width: 768px) {
  .friends-dropdown-mobile { position: fixed; left: 8px; right: 8px; top: 56px; width: auto; max-width: none; transform: none; }
}

.friends-dropdown-header { padding: 10px 14px; background: linear-gradient(135deg, #10b981, #059669); color: #fff; }
.friends-dropdown-title { display: flex; align-items: center; gap: 8px; font-weight: 600; }
.friends-dropdown-tabs { display: flex; gap: 8px; padding: 8px 10px 0; background: #fff; }
.friends-tab-btn { border: none; background: #f3f4f6; color: #374151; padding: 6px 10px; border-radius: 999px; cursor: pointer; font-weight: 600; }
.friends-tab-btn.active { background: #10b981; color: #fff; }

.friends-dropdown-body { padding: 6px 8px 10px; max-height: 380px; overflow-y: auto; }
.friends-loading, .friends-empty { padding: 40px 20px; text-align: center; color: #6c757d; }
.friends-empty i { font-size: 32px; margin-bottom: 10px; }

.friends-list-container { display: flex; flex-direction: column; gap: 8px; }
.friends-list-item {
  position: relative;
  display: grid; grid-template-columns: 46px 1fr auto; gap: 10px; padding: 8px 10px; border-radius: 10px;
  background: #f9fafb; align-items: center; cursor: pointer;
}
.friends-list-item::before {
  content: ""; position: absolute; inset: 0; background-image: var(--group-bg, none);
  background-size: cover; background-position: center; opacity: .12; border-radius: 10px; pointer-events: none;
}
.friends-list-item:hover { background: #f3f4f6; }

.avatar-wrap { position: relative; width: 36px; height: 36px; margin-right: 10px; }
.friends-avatar { width: 36px; height: 36px; border-radius: 50%; object-fit: cover; position: relative; z-index: 1; }
.friends-avatar-halo {
  position: absolute; top:-3px; left:-3px; width:46px; height:46px; border-radius:50%;
  background: conic-gradient(#ff0080,#ff0040,#ff4000,#ff8000,#ffbf00,#ffff00,#bfff00,#80ff00,#40ff00,#00ff00,#00ff40,#00ff80,#00ffbf,#00ffff,#00bfff,#0080ff,#0040ff,#0000ff,#4000ff,#8000ff,#bf00ff,#ff00ff,#ff00bf,#ff0080);
  filter: blur(2px); opacity: .6; z-index: 0;
}
/* 在线状态 */
.presence-dot { position: absolute; right: -2px; bottom: -2px; width: 10px; height: 10px; border-radius: 999px; border: 2px solid #fff; }
.presence-dot.online { background: #10b981; }
.presence-dot.offline { background: #9ca3af; }

.friends-user-info { min-width: 0; }
.friends-user-name { font-weight: 600; color: #111827; overflow: hidden; text-overflow: ellipsis; white-space: nowrap; }
.friends-user-uid { color: #9ca3af; font-size: 12px; margin-top: 2px; }
.friends-list-actions.hint { color: #9ca3af; font-size: 12px; }

/* 右键菜单 */
.friend-menu {
  position: fixed; z-index: 2000; background:#fff; border:1px solid #e5e7eb; border-radius:8px; padding:6px 0;
  box-shadow: 0 12px 30px rgba(15, 23, 42, .18);
}
.friend-menu > li { padding: 6px 14px; white-space: nowrap; cursor: pointer; }
.friend-menu > li:hover { background:#f5f7fa; }

/* 添加好友 */
.add-friend-box { display: flex; gap: 8px; padding: 8px; }
.add-friend-input {
  flex: 1; border: 1px solid #d1d5db; border-radius: 8px; padding: 6px 8px; font-size: 14px;
}
.friends-btn { padding: 6px 10px; border-radius: 8px; border: 1px solid #d1d5db; background: #fff; cursor: pointer; }
.friends-btn.primary { background: #10b981; color: #fff; border-color: #10b981; }
</style>
