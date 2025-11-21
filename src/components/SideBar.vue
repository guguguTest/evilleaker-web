<script setup>
import {ref} from 'vue';
import {RouterLink} from 'vue-router';
import {useSidebarStore} from '@/stores/sidebar';
import {useAuthStore} from '@/stores/auth';
import {useUserCompute} from '@/composable/user';

const authStore = useAuthStore();
const sidebarStore = useSidebarStore();
const {userRankInfo, userBanState} = useUserCompute();
const menus = ref([
    {
        child: [
            {
                name: 'sidebar.home',
                path: '/home',
                icon: 'fas fa-home me-2'
            },
            {
                name: 'sidebar.download',
                path: '/download',
                icon: 'fas fa-download me-2'
            },
            {
                name: 'sidebar.tools',
                path: '/tools',
                icon: 'fas fa-edit me-2'
            },
            {
                name: 'sidebar.patcher',
                path: '/patcher',
                icon: 'fas fa-plug me-2'
            },
            {
                name: 'sidebar.settings',
                path: '/settings',
                icon: 'fas fa-cog me-2'
            },
            {
                name: 'sidebar.userVerification',
                path: '/user-verification',
                icon: 'fas fa-user-shield me-2'
            },
        ]
    },
    {
        name: 'sidebar.functions',
        icon: 'fas fa-cogs',
        child: [
            {
                name: 'sidebar.fortune',
                path: '/fortune',
                icon: 'fas fa-star me-2'
            },
            {
                name: 'sidebar.ccb',
                path: '/ccb',
                icon: 'fas fa-search me-2'
            },
            {
                name: 'sidebar.forum',
                path: '/forum',
                icon: 'fas fa-comments me-2'
            },
            {
                name: 'sidebar.exchange',
                path: '/exchange',
                icon: 'fas fa-exchange-alt me-2'
            },
            {
                name: 'sidebar.pointShop',
                path: '/point-shop',
                icon: 'fas fa-store me-2'
            },
            {
                name: 'sidebar.minigame',
                path: '/minigame',
                icon: 'fas fa-gamepad me-2'
            },
        ]
    },
    {
        name: 'sidebar.admin',
        icon: 'fas fa-shield-alt',
        child: [
            {
                name: 'sidebar.userManager',
                path: '/admin/user-manager',
                icon: 'fas fa-users me-2'
            },
            {
                name: 'sidebar.announcementAdmin',
                path: '/admin/announcement',
                icon: 'fas fa-bullhorn me-2'
            },
            {
                name: 'sidebar.siteAdmin',
                path: '/admin/site',
                icon: 'fas fa-cogs me-2'
            },
            {
                name: 'sidebar.forumAdmin',
                path: '/admin/forum',
                icon: 'fas fa-toolbox me-2'
            },
            {
                name: 'sidebar.downloadAdmin',
                path: '/admin/download',
                icon: 'fas fa-download me-2'
            },
            {
                name: 'sidebar.verificationAdmin',
                path: '/admin/verification',
                icon: 'fas fa-tasks me-2'
            },
            {
                name: 'sidebar.pointsShopAdmin',
                path: '/admin/points-shop',
                icon: 'fas fa-coins me-2'
            },
            {
                name: 'sidebar.point2ShopAdmin',
                path: '/admin/point2-shop',
                icon: 'fas fa-dove me-2'
            },
            {
                name: 'sidebar.creditShopAdmin',
                path: '/admin/credit-shop',
                icon: 'fas fa-star me-2'
            },
            {
                name: 'sidebar.orderEntry',
                path: '/admin/order-entry',
                icon: 'fas fa-file-invoice me-2'
            },
        ]
    }
]);
</script>

<template>
    <!-- 侧边栏 -->
    <div class="sidebar" :class="{show: sidebarStore.state}">
        <div class="sidebar-header">
            <span class="sidebar-title"></span>
        </div>
        <div class="sidebar-user-area" id="user-area-mobile"
             :style="{ '--user-rank-bg': `url(${userRankInfo.background})` }">
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
            <div class="user-info" id="user-info-mobile" style="display: block;">
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
                    <a href="javascript:void(0);" id="logout-mobile" class="mobile-user-action-btn">
                        <i class="fas fa-sign-out-alt me-2"></i>
                        <span data-i18n="user.logout">{{ $t('user.logout') }}</span>
                    </a>
                </div>
            </div>
        </div>
        <template v-for="item in menus">
            <template v-if="item.name">
                <div class="sidebar-section-title" id="admin-section-title">
                    <i :class="item.icon"></i>
                    <span>{{ $t(item.name) }}</span>
                </div>
            </template>
            <ul class="sidebar-nav">
                <template v-for="child in item.child">
                    <li>
                        <RouterLink :to="child.path" custom v-slot="{ navigate, href, isActive }">
                            <a :class="{'active' : isActive}" :href="href" @click="navigate">
                                <i :class="child.icon"></i>
                                <span>{{ $t(child.name) }}</span>
                            </a>
                        </RouterLink>
                    </li>
                </template>
            </ul>
            <div class="sidebar-divider"></div>
        </template>
    </div>
</template>

<style scoped>

</style>