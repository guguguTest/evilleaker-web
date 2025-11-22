<script setup>
import {RouterLink, useRoute, useRouter} from 'vue-router';
import {useSidebarStore} from '@/stores/sidebar';
import {useAuthStore} from '@/stores/auth';
import {useUserCompute} from '@/composable/user';
import {onMounted, ref, watch} from "vue";

const authStore = useAuthStore();
const sidebarStore = useSidebarStore();
const router = useRouter();
const {userRankInfo, userBanState} = useUserCompute();

const routes = router.options.routes;
const route = useRoute();
const menu = ref([]);

// 移动端“退出登录”按钮会用到
async function handleLogout() {
  try {
    await authStore.logout();
  } catch (e) {
    console.error('logout error', e);
  } finally {
    await router.push('/home');
  }
}

// 跳转
function goTo(to) {
  router.push(to);
  sidebarStore.hide();
}

// 菜单高亮
function isActive(path) {
  // 去掉末尾斜杠
  const normalize = p => p.replace(/\/$/, '');
  const menuPath = normalize(path)
  const currentPath = normalize(route.path)
  // 完全相等
  if (currentPath === menuPath) return true
  // 当前页面是菜单 path 的子路径
  return currentPath.startsWith(menuPath + '/')
}

// 检查菜单权限
// 菜单要显示，需要满足几个条件
// rank needLogin permission.visible
function checkMenuPermission(menu) {
  const user = authStore.user;
  const rank = user ? user.user_rank : 0;
  const permission = authStore.hasPermission(menu.meta?.rule);
  const ban = user ? user.banState : false;

  console.log('菜单条件', '等级: ', rank, '登录: ', !!user, '权限: ', permission, '封禁: ', ban);

  if (menu.meta.ban !== undefined && !menu.meta.ban.includes(ban))
    return false;
  if (menu.meta.rank !== undefined && !menu.meta.rank.includes(rank))
    return false;
  if (menu.meta.needLogin !== undefined && menu.meta.needLogin && !user)
    return false;
  if (menu.meta.rule !== undefined && !permission.visible)
    return false;
  return true;
}

// 构造菜单树
function buildMenu() {
  menu.value = [];
  routes.forEach((route) => {
    if (route.meta?.hidden === true)
      return;
    const c = [];
    if (route.children) {
      route.children.forEach(child => {
        if (child.meta?.hidden === true)
          return;
        if (!checkMenuPermission(child))
          return;
        c.push({
          path: child.path,
          title: child.meta?.title,
          icon: child.meta?.icon
        });
      });
    }
    if (c.length > 0) {
      menu.value.push({
        path: route.path,
        title: route.meta?.title,
        icon: route.meta?.icon,
        child: c
      });
    }
  });
}

onMounted(() => {
  // 构造菜单
  buildMenu();
});

// 监听登录状态，刷新菜单
watch(() => authStore.permissions, () => {
  console.log('用户权限更新，刷新菜单栏');
  buildMenu();
});
</script>

<template>
  <!-- 侧边栏 -->
  <div class="sidebar" :class="{show: sidebarStore.state}">
    <div class="sidebar-header">
      <span class="sidebar-title"></span>
    </div>
    <div class="sidebar-user-area" id="user-area-mobile"
         :style="authStore.user ? { '--user-rank-bg': `url(${userRankInfo.background})` } : {}">
      <div class="auth-links" id="auth-links-mobile" v-if="!authStore.user">
        <router-link to="/login" custom v-slot="{ navigate, href }">
          <a :href="href" @click="navigate" data-page="login" class="mobile-auth-btn">
            <i class="fas fa-sign-in-alt me-2"></i>
            <span>{{ $t('user.login') }}</span>
          </a>
        </router-link>
        <router-link to="/register" custom v-slot="{ navigate, href }">
          <a :href="href" @click="navigate" data-page="register" class="mobile-auth-btn">
            <i class="fas fa-user-plus me-2"></i>
            <span>{{ $t('user.register') }}</span>
          </a>
        </router-link>
      </div>
      <div class="user-info" id="user-info-mobile" style="display: block;" v-if="authStore.user">
        <div class="user-basic">
          <div class="user-avatar-wrapper-mobile">
            <img id="user-avatar-mobile" class="user-avatar-mobile" alt="" :src="authStore.user.avatar">
            <div class="avatar-effect-rainbow" v-if="authStore.user.user_rank === 5"></div>
            <img class="user-state-icon-mobile" alt="" :title="userBanState.title" :src="userBanState.src">
            <img class="user-auth-icon-mobile" alt="" title="个人认证"
                 src="https://oss.am-all.com.cn/asset/img/other/dc/account/account_auth_1.png"
                 v-if="authStore.user.account_auth === 1">
            <img class="user-auth-icon-mobile" alt="" title="官方认证"
                 src="https://oss.am-all.com.cn/asset/img/other/dc/account/account_auth_2.png"
                 v-if="authStore.user.account_auth === 2">
          </div>
          <div class="user-info-text">
            <div id="user-nickname-mobile" class="user-nickname">{{ authStore.user.nickname }}</div>
            <div id="user-email-mobile" class="user-email">{{ authStore.user.email }}</div>
            <div id="user-uid-mobile" class="user-uid">UID: {{ authStore.user.uid }}</div>
            <div id="user-points-mobile" class="user-points">
              {{ $t('user.points') }}: {{ authStore.user.points || 0 }}
            </div>
          </div>
        </div>
        <div class="user-actions">
          <router-link to="/user-settings" custom v-slot="{ navigate, href }">
            <a :href="href" data-page="user-settings" class="mobile-user-action-btn" @click="navigator">
              <i class="fas fa-cog me-2"></i>
              <span data-i18n="user.settings">{{ $t('user.settings') }}</span>
            </a>
          </router-link>
          <a
              href="javascript:void(0);"
              id="logout-mobile"
              class="mobile-user-action-btn"
              @click.prevent="handleLogout"
          >
            <i class="fas fa-sign-out-alt me-2"></i>
            <span data-i18n="user.logout">{{ $t('user.logout') }}</span>
          </a>
        </div>
      </div>
    </div>
    <template v-for="(item, i) in menu">
      <!-- 菜单分组标题 -->
      <template v-if="item.title">
        <div class="sidebar-section-title" id="admin-section-title">
          <i :class="item.icon"></i>
          <span>{{ $t(item.title) }}</span>
        </div>
      </template>
      <!-- 菜单项 -->
      <ul class="sidebar-nav">
        <li v-for="child in item.child">
          <a :class="{'active' : isActive(child.path)}" href="javascript:void(0);" @click="goTo(child.path)">
            <i :class="child.icon"></i>
            <span>{{ $t(child.title) }}</span>
          </a>
        </li>
      </ul>
      <!-- 分割线 -->
      <div class="sidebar-divider" v-if="i < menu.length - 1"></div>
    </template>
  </div>
</template>

<style scoped>

</style>