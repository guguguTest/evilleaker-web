<script setup>
import {RouterLink, useRoute, useRouter} from 'vue-router';
import {useSidebarStore} from '@/stores/sidebar';
import {useAuthStore} from '@/stores/auth';
import {useUserCompute} from '@/composable/user';

const authStore = useAuthStore();
const sidebarStore = useSidebarStore();
const router = useRouter();
const {userRankInfo, userBanState} = useUserCompute();

const routes = router.options.routes;
const route = useRoute();

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

function goTo(to) {
  router.push(to);
  sidebarStore.hide();
}

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
    <template v-for="item in routes">
      <!-- 菜单分组标题 -->
      <template v-if="item.meta && !item.meta.hidden && item.meta.title">
        <div class="sidebar-section-title" id="admin-section-title">
          <i :class="item.meta.icon"></i>
          <span>{{ $t(item.meta.title) }}</span>
        </div>
      </template>
      <template v-if="item.children">
        <ul class="sidebar-nav" v-if="item.children">
          <template v-for="child in item.children">
            <li v-if="child.meta && !child.meta.hidden">
              <a :class="{'active' : isActive(child.path)}" href="javascript:void(0);" @click="goTo(child.path)">
                <i :class="child.meta.icon"></i>
                <span>{{ $t(child.meta.title) }}</span>
              </a>
            </li>
          </template>
        </ul>
        <div class="sidebar-divider"></div>
      </template>
    </template>
  </div>
</template>

<style scoped>

</style>