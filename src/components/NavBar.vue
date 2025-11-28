<script setup>
import {ref} from 'vue';
import {RouterLink, useRouter} from 'vue-router';
import {useI18nStore} from '@/stores/i18n';
import {useAuthStore} from '@/stores/auth';
import {useSidebarStore} from '@/stores/sidebar';
import {useUserCompute} from '@/composable/user';
import MessageDropdown from '@/components/MessageDropdown.vue';
import FriendsDropdown from '@/components/FriendsDropdown.vue';


const i18nStore = useI18nStore();
const authStore = useAuthStore();
const sidebarStore = useSidebarStore();
const {userRankInfo, userSpecialRank, userBanState, userAuth} = useUserCompute();
const langPop = ref(false);
const langPopMobile = ref(false);
const userPop = ref(false);
const router = useRouter();

function switchLang(lang) {
  i18nStore.setLocale(lang);
  langPop.value = false;
  langPopMobile.value = false;
}

// 电脑端用户菜单里的退出按钮会用到
async function handleLogout() {
  try {
    // 调后端 /api/logout（从 Authorization 里拿 token）
    await authStore.logout();
  } catch (e) {
    console.error('logout error', e);
  } finally {
    await router.push('/home');
  }
}
</script>

<template>
  <!-- 顶部导航栏 -->
  <nav class="top-navbar">
    <!-- 左侧区域 -->
    <div class="navbar-left">
      <!-- 移动端菜单按钮 -->
      <button class="mobile-toggle" @click="sidebarStore.toggle">
                <span class="hamburger-icon" :class="{open: sidebarStore.state}">
                  <span></span>
                  <span></span>
                  <span></span>
                </span>
      </button>
      <!-- PC端语言选择器 -->
      <div class="language-selector language-selector-pc">
        <button class="language-btn" @click="langPop = !langPop">
          <i class="fas fa-globe"></i>
          <span>{{ $t('navbar.language') }}</span>
        </button>
        <div class="language-dropdown" :class="{show: langPop}">
          <a href="javascript:void(0);" class="language-item" @click="switchLang('zh')">中文</a>
          <a href="javascript:void(0);" class="language-item" @click="switchLang('en')">English</a>
          <a href="javascript:void(0);" class="language-item" @click="switchLang('ja')">日本語</a>
        </div>
      </div>
    </div>

    <!-- 中央区域 -->
    <div class="navbar-center">
      <!-- 品牌标题 -->
      <div class="brand">
        <span>{{ $t('navbar.brand') }}</span>
      </div>
    </div>

    <!-- 右侧区域 -->
    <div class="navbar-right">
      <!-- 移动端控件容器 -->
      <div class="mobile-controls">
        <div id="mobile-message-placeholder" class="top-icons-mobile">
          <FriendsDropdown mobile />
          <MessageDropdown mobile />
        </div>
        <!-- 移动端语言选择器 -->
        <div class="language-selector language-selector-mobile">
          <button class="language-btn" @click="langPopMobile = !langPopMobile">
            <i class="fas fa-globe"></i>
          </button>
          <div class="language-dropdown" :class="{show: langPopMobile}">
            <a href="javascript:void(0);" class="language-item" @click="switchLang('zh')">中文</a>
            <a href="javascript:void(0);" class="language-item" @click="switchLang('en')">English</a>
            <a href="javascript:void(0);" class="language-item" @click="switchLang('ja')">日本語</a>
          </div>
        </div>
      </div>

      <!-- PC端用户区域容器 -->
      <div class="user-area-container">
        <!-- PC端消息图标占位符 -->
        <div id="pc-message-placeholder" class="top-icons-pc">
          <FriendsDropdown />
          <MessageDropdown />
        </div>
        <div class="user-area" id="user-area-pc">
          <!-- 登录前 -->
          <div class="auth-links" id="auth-links-pc" v-if="!authStore.user">
            <router-link to="/login" custom v-slot="{ navigate, href }">
              <a :href="href" data-page="login" @click="navigate">{{ $t('user.login') }}</a>
            </router-link>
            <span class="divider">/</span>
            <router-link to="/register" custom v-slot="{ navigate, href }">
              <a :href="href" data-page="register" @click="navigate">{{ $t('user.register') }}</a>
            </router-link>
          </div>
          <!-- 登录后 -->
          <div class="user-info" id="user-info-pc" v-if="authStore.user"
               @mouseenter="userPop = true"
               @mouseleave="userPop = false"
               :style="{ display: 'flex', '--user-rank-bg': `url(${userRankInfo.background})` }">
            <div class="user-avatar-wrapper-pc">
              <img id="user-avatar-pc" class="user-avatar-pc" alt="" :src="authStore.user.avatar">
              <div class="avatar-effect-rainbow" v-if="authStore.user.user_rank === 5"></div>
              <img class="user-state-icon" alt="" :title="userBanState.title" :src="userBanState.src">
              <img class="user-auth-icon-personal" alt="" title="个人认证"
                   src="https://oss.am-all.com.cn/asset/img/other/dc/account/account_auth_1.png"
                   v-if="authStore.user.account_auth === 1">
              <img class="user-auth-icon-official" alt="" title="官方认证"
                   src="https://oss.am-all.com.cn/asset/img/other/dc/account/account_auth_2.png"
                   v-if="authStore.user.account_auth === 2">
            </div>
            <div class="user-basic-info">
              <span id="user-nickname-pc" class="user-nickname">{{ authStore.user.nickname }}</span>
              <span id="user-uid-pc" class="user-uid">{{ authStore.user.email }}</span>
            </div>
            <img id="user-rank-icon-pc" class="user-rank-icon" alt="" :src="userRankInfo.icon">

            <div v-show="userPop" class="user-dropdown-fix">
              <div class="user-dropdown" :class="{show: userPop}">
                <div class="dropdown-rank">
                                    <span id="dropdown-rank">
                                        <i class="fas fa-crown me-2"></i>
                                        用户组: {{ $t(userRankInfo.text) }}
                                    </span>
                </div>
                <div class="dropdown-special-rank" v-if="userSpecialRank">
                  <i class="fas fa-crown me-2"></i>
                  <span id="dropdown-special-rank">{{ $t(userSpecialRank) }}</span>
                </div>
                <div class="dropdown-auth" v-if="userAuth">
                  <i class="fas fa-certificate me-2"></i>
                  <span id="dropdown-auth">{{ $t(userAuth) }}</span>
                </div>
                <div class="dropdown-uid">
                  <i class="fas fa-id-card me-2"></i>
                  <span id="dropdown-uid">UID: {{ authStore.user.uid }}</span>
                </div>
                <div class="dropdown-points" id="dropdown-points">
                  <i class="fas fa-coins me-2"></i>
                  <span>{{ $t('user.points') }}</span>:&nbsp;
                  <span id="dropdown-points-value">{{ authStore.user.points || 0 }}</span>
                </div>
                <div class="dropdown-credit" id="dropdown-credit">
                  <i class="fas fa-star me-2"></i>
                  <span>{{ $t('user.credit') }}</span>:&nbsp;
                  <span id="dropdown-credit-value">{{ authStore.user.credit || 0 }}</span>
                </div>
                <router-link to="/user-settings" custom v-slot="{ navigate, href }">
                  <a :href="href" data-page="user-settings"
                     @click="navigator">{{ $t('user.settings') }}</a>
                </router-link>
                <a
                    href="javascript:void(0);"
                    id="logout-pc"
                    @click.prevent="handleLogout"
                >
                  {{ $t('user.logout') }}
                </a>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  </nav>
</template>

<style scoped>
.user-dropdown-fix {
  position: absolute;
  top: 100%;
  left: 0;
  right: 0;
  min-width: 100%;
  z-index: 1000;
  padding-top: 5px;
}

#user-info-pc .user-dropdown {
  position: static;
}

.top-icons-pc {
  display: flex;
  align-items: center;
  margin-right: 12px;
}

.top-icons-mobile {
  display: flex;
  align-items: center;
  margin-right: 8px;
}

</style>