// src/router/index.js
import {createRouter, createWebHashHistory} from 'vue-router';
import {useAuthStore} from '@/stores/auth';

const routes = [
    // 第一个没名字的栏目
    {
        path: '/',
        redirect: '/home',
        children: [
            // 首页
            {
                name: 'Home',
                path: '/home',
                component: () => import('@/views/Home.vue'),
                meta: {title: 'sidebar.home', icon: 'fas fa-home me-2', role: 'home'}
            },
            // 用户相关 不显示在sidebar
            {
                name: 'Login',
                path: '/login',
                component: () => import('@/views/user/Login.vue'),
                meta: {hidden: true}
            },
            {
                name: 'Register',
                path: '/register',
                component: () => import('@/views/user/Register.vue'),
                meta: {hidden: true}
            },
            {
                name: 'ForgotPassword',
                path: '/forgot-password',
                component: () => import('@/views/user/ForgotPassword.vue'),
                meta: {hidden: true}
            },
            {
                name: 'ResetPassword',
                path: '/reset-password',
                component: () => import('@/views/user/ResetPassword.vue'),
                meta: {hidden: true}
            },
            {
                name: 'UserSettings',
                path: '/user-settings',
                component: () => import('@/views/user/UserSettings.vue'),
                meta: {hidden: true, role: 'user-settings'}
            },
            // 下载
            {
                name: 'Download',
                path: '/download',
                component: () => import('@/views/404.vue'),
                meta: {title: 'sidebar.download', icon: 'fas fa-download me-2', role: 'download'}
            },
            // 实用工具
            {
                name: 'Tools',
                path: '/tools',
                component: () => import('@/views/404.vue'),
                meta: {title: 'sidebar.tools', icon: 'fas fa-edit me-2', role: 'tools'}
            },
            // 补丁工具
            {
                name: 'Patcher',
                path: '/patcher',
                component: () => import('@/views/404.vue'),
                meta: {title: 'sidebar.patcher', icon: 'fas fa-plug me-2', role: 'dllpatcher'}
            },
            // 网页设置
            {
                name: 'Settings',
                path: '/settings',
                component: () => import('@/views/Settings.vue'),
                meta: {title: 'sidebar.settings', icon: 'fas fa-cog me-2', role: 'settings'}
            },
            // 用户认证
            {
                name: 'UserVerification',
                path: '/user-verification',
                component: () => import('@/views/404.vue'),
                meta: {title: 'sidebar.userVerification', icon: 'fas fa-user-shield me-2', role: 'user-verification'},
            },
        ]
    },
    // 功能
    {
        name: 'Functions',
        path: '/',
        meta: {title: 'sidebar.functions', icon: 'fas fa-cogs'},
        children: [
            {
                name: 'Fortune',
                path: '/fortune',
                component: () => import('@/views/404.vue'),
                meta: {title: 'sidebar.fortune', icon: 'fas fa-star me-2', role: 'fortune'}
            },
            {
                name: 'Ccb',
                path: '/ccb',
                component: () => import('@/views/404.vue'),
                meta: {title: 'sidebar.ccb', icon: 'fas fa-search me-2', role: 'ccb'}
            },
            {
                name: 'Forum',
                path: '/forum',
                component: () => import('@/views/404.vue'),
                meta: {title: 'sidebar.forum', icon: 'fas fa-comments me-2', role: 'forum'}
            },
            {
                name: 'Exchange',
                path: '/exchange',
                component: () => import('@/views/404.vue'),
                meta: {title: 'sidebar.exchange', icon: 'fas fa-exchange-alt me-2', role: 'exchange'}
            },
            {
                name: 'PointShop',
                path: '/point-shop',
                component: () => import('@/views/404.vue'),
                meta: {title: 'sidebar.pointShop', icon: 'fas fa-store me-2', role: 'point-shop'}
            },
            {
                name: 'MiniGame',
                path: '/minigame',
                component: () => import('@/views/404.vue'),
                meta: {title: 'sidebar.minigame', icon: 'fas fa-gamepad me-2', role: 'minigame'}
            }
        ]
    },
    // 管理
    {
        name: 'Admin',
        path: '/admin',
        meta: {title: 'sidebar.admin', icon: 'fas fa-shield-alt'},
        children: [
            {
                name: 'UserAdmin',
                path: '/admin/user-manager',
                component: () => import('@/views/404.vue'),
                meta: {title: 'sidebar.userManager', icon: 'fas fa-users me-2', role: 'user-manager'}
            },
            {
                name: 'AnnouncementAdmin',
                path: '/admin/announcement',
                component: () => import('@/views/404.vue'),
                meta: {title: 'sidebar.announcementAdmin', icon: 'fas fa-bullhorn me-2', role: 'announcement-admin'}
            },
            {
                name: 'SiteAdmin',
                path: '/admin/site',
                component: () => import('@/views/404.vue'),
                meta: {title: 'sidebar.siteAdmin', icon: 'fas fa-cogs me-2', role: 'site-admin'}
            },
            {
                name: 'ForumAdmin',
                path: '/admin/forum',
                component: () => import('@/views/404.vue'),
                meta: {title: 'sidebar.forumAdmin', icon: 'fas fa-toolbox me-2', role: 'forum-admin'}
            },
            {
                name: 'DownloadAdmin',
                path: '/admin/download',
                component: () => import('@/views/404.vue'),
                meta: {title: 'sidebar.downloadAdmin', icon: 'fas fa-download me-2', role: 'download-admin'}
            },
            {
                name: 'VerificationAdmin',
                path: '/admin/verification',
                component: () => import('@/views/404.vue'),
                meta: {title: 'sidebar.verificationAdmin', icon: 'fas fa-tasks me-2', role: 'verification-admin'}
            },
            {
                name: 'PointsShopAdmin',
                path: '/admin/points-shop',
                component: () => import('@/views/404.vue'),
                meta: {title: 'sidebar.pointsShopAdmin', icon: 'fas fa-coins me-2', role: 'points-shop-admin'}
            },
            {
                name: 'Point2ShopAdmin',
                path: '/admin/point2-shop',
                component: () => import('@/views/404.vue'),
                meta: {title: 'sidebar.point2ShopAdmin', icon: 'fas fa-dove me-2', role: 'point2-shop-admin'}
            },
            {
                name: 'CreditShopAdmin',
                path: '/admin/credit-shop',
                component: () => import('@/views/404.vue'),
                meta: {title: 'sidebar.creditShopAdmin', icon: 'fas fa-star me-2'}
            },
            {
                name: 'OrderEntry',
                path: '/admin/order-entry',
                component: () => import('@/views/404.vue'),
                meta: {title: 'sidebar.orderEntry', icon: 'fas fa-file-invoice me-2', role: 'order-entry'}
            }
        ]
    },
    // 404
    {
        path: '/404',
        name: '404',
        component: () => import('@/views/404.vue'),
    },
    // 403
    {
        path: '/403',
        name: '403',
        component: () => import('@/views/403.vue'),
    },
    {
        path: '/:pathMatch(.*)*',
        redirect: '/404',
    },
];

const router = createRouter({
    history: createWebHashHistory(),
    routes,
});

router.beforeEach((to, from, next) => {
    if (to.meta && to.meta.role) {
        const authStore = useAuthStore();
        const permission = authStore.hasPermission(to.meta.role);
        if (!permission || !permission.allowed)
            return next('/403');
    }
    return next();
});

export default router;
