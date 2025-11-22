import {createRouter, createWebHashHistory} from 'vue-router';
import {useAuthStore} from '@/stores/auth';

const RANK_ALL = [0, 1, 2, 3, 4, 5];
const RANK_ONLY_5 = [5];

// 所有人都能看到的界面
const PRESET_ALL = {
    rank: RANK_ALL,
    needLogin: false,
    ban: [0],
};

// 只要能录就能看到
const PRESET_LOGIN = {
    rank: RANK_ALL,
    needLogin: true,
    ban: [0],
};

const PRESET_ADMIN = {
    rank: RANK_ONLY_5,
    needLogin: true,
    ban: [0],
};

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
                meta: {
                    ...PRESET_ALL,
                    title: 'sidebar.home',
                    icon: 'fas fa-home me-2',
                    rule: 'home',
                    ban: [0, 1, 2],
                }
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
                meta: {
                    ...PRESET_LOGIN,
                    hidden: true,
                    rule: 'user-settings',
                    ban: [0, 1],
                }
            },
            // 下载
            {
                name: 'Download',
                path: '/download',
                component: () => import('../views/Download.vue'),
                meta: {
                    ...PRESET_LOGIN,
                    title: 'sidebar.download',
                    icon: 'fas fa-download me-2',
                    rule: 'download',
                    ban: [0, 1],
                }
            },
            {
                name: 'DownloadDetail',
                path: '/download-detail/:id',
                component: () => import('../views/DownloadDetail.vue'),
                props: true,
                meta: {hidden: true}
            },
            // 实用工具
            {
                name: 'Tools',
                path: '/tools',
                component: () => import('@/views/404.vue'),
                meta: {
                    ...PRESET_LOGIN,
                    title: 'sidebar.tools',
                    icon: 'fas fa-edit me-2',
                    rule: 'tools',
                    ban: [0, 1]
                }
            },
            // 补丁工具
            {
                name: 'Patcher',
                path: '/patcher',
                component: () => import('@/views/404.vue'),
                meta: {
                    ...PRESET_LOGIN,
                    title: 'sidebar.patcher',
                    icon: 'fas fa-plug me-2',
                    rule: 'dllpatcher',
                    ban: [0, 1]
                }
            },
            // 网页设置
            {
                name: 'Settings',
                path: '/settings',
                component: () => import('@/views/Settings.vue'),
                meta: {
                    ...PRESET_ALL,
                    title: 'sidebar.settings',
                    icon: 'fas fa-cog me-2',
                    rule: 'settings',
                    ban: [0, 1, 2],
                }
            },
            // 用户认证
            {
                name: 'UserVerification',
                path: '/user-verification',
                component: () => import('@/views/404.vue'),
                meta: {
                    ...PRESET_LOGIN,
                    title: 'sidebar.userVerification',
                    icon: 'fas fa-user-shield me-2',
                    rule: 'user-verification'
                },
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
                meta: {
                    ...PRESET_LOGIN,
                    title: 'sidebar.fortune',
                    icon: 'fas fa-star me-2',
                    rule: 'fortune'
                }
            },
            {
                name: 'Ccb',
                path: '/ccb',
                component: () => import('@/views/404.vue'),
                meta: {
                    ...PRESET_LOGIN,
                    title: 'sidebar.ccb',
                    icon: 'fas fa-search me-2',
                    rule: 'ccb'
                }
            },
            {
                name: 'Forum',
                path: '/forum',
                component: () => import('@/views/404.vue'),
                meta: {
                    ...PRESET_LOGIN,
                    title: 'sidebar.forum',
                    icon: 'fas fa-comments me-2',
                    rule: 'forum'
                }
            },
            {
                name: 'Exchange',
                path: '/exchange',
                component: () => import('@/views/404.vue'),
                meta: {
                    ...PRESET_LOGIN,
                    title: 'sidebar.exchange',
                    icon: 'fas fa-exchange-alt me-2',
                    rule: 'exchange'
                }
            },
            {
                name: 'PointShop',
                path: '/point-shop',
                component: () => import('@/views/404.vue'),
                meta: {
                    ...PRESET_LOGIN,
                    title: 'sidebar.pointShop',
                    icon: 'fas fa-store me-2',
                    rule: 'point-shop'
                }
            },
            {
                name: 'MiniGame',
                path: '/minigame',
                component: () => import('@/views/404.vue'),
                meta: {
                    ...PRESET_LOGIN,
                    title: 'sidebar.minigame',
                    icon: 'fas fa-gamepad me-2',
                    rule: 'minigame'
                }
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
                meta: {
                    ...PRESET_ADMIN,
                    title: 'sidebar.userManager',
                    icon: 'fas fa-users me-2',
                    rule: 'user-manager'
                }
            },
            {
                name: 'AnnouncementAdmin',
                path: '/admin/announcement',
                component: () => import('@/views/404.vue'),
                meta: {
                    ...PRESET_ADMIN,
                    title: 'sidebar.announcementAdmin',
                    icon: 'fas fa-bullhorn me-2',
                    rule: 'announcement-admin'
                }
            },
            {
                name: 'SiteAdmin',
                path: '/admin/site',
                component: () => import('@/views/404.vue'),
                meta: {
                    ...PRESET_ADMIN,
                    title: 'sidebar.siteAdmin',
                    icon: 'fas fa-cogs me-2',
                    rule: 'site-admin'
                }
            },
            {
                name: 'ForumAdmin',
                path: '/admin/forum',
                component: () => import('@/views/404.vue'),
                meta: {
                    ...PRESET_ADMIN,
                    title: 'sidebar.forumAdmin',
                    icon: 'fas fa-toolbox me-2',
                    rule: 'forum-admin'
                }
            },
            {
                name: 'DownloadAdmin',
                path: '/admin/download',
                component: () => import('@/views/404.vue'),
                meta: {
                    ...PRESET_ADMIN,
                    title: 'sidebar.downloadAdmin',
                    icon: 'fas fa-download me-2',
                    rule: 'download-admin'
                }
            },
            {
                name: 'VerificationAdmin',
                path: '/admin/verification',
                component: () => import('@/views/404.vue'),
                meta: {
                    ...PRESET_ADMIN,
                    title: 'sidebar.verificationAdmin',
                    icon: 'fas fa-tasks me-2',
                    rule: 'verification-admin'
                }
            },
            {
                name: 'PointsShopAdmin',
                path: '/admin/points-shop',
                component: () => import('@/views/404.vue'),
                meta: {
                    ...PRESET_ADMIN,
                    title: 'sidebar.pointsShopAdmin',
                    icon: 'fas fa-coins me-2',
                    rule: 'points-shop-admin'
                }
            },
            {
                name: 'Point2ShopAdmin',
                path: '/admin/point2-shop',
                component: () => import('@/views/404.vue'),
                meta: {
                    ...PRESET_ADMIN,
                    title: 'sidebar.point2ShopAdmin',
                    icon: 'fas fa-dove me-2',
                    rule: 'point2-shop-admin'
                }
            },
            {
                name: 'CreditShopAdmin',
                path: '/admin/credit-shop',
                component: () => import('@/views/404.vue'),
                meta: {
                    ...PRESET_ADMIN,
                    title: 'sidebar.creditShopAdmin',
                    icon: 'fas fa-star me-2'
                }
            },
            {
                name: 'OrderEntry',
                path: '/admin/order-entry',
                component: () => import('@/views/404.vue'),
                meta: {
                    ...PRESET_ADMIN,
                    title: 'sidebar.orderEntry',
                    icon: 'fas fa-file-invoice me-2',
                    rule: 'order-entry'
                }
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
let authStore = null;

// 页面要显示，需要满足几个条件
// rank needLogin permission.allowed
function hasPermission(to) {
    const user = authStore.user;
    const rank = user ? user.user_rank : 0;
    const permission = authStore.hasPermission(to.meta?.rule);
    const ban = user ? user.banState : false;

    console.log('权限条件', '等级: ', rank, '登录: ', !!user, '权限: ', permission, '封禁: ', ban);

    if (to.meta.ban !== undefined && !to.meta.ban.includes(ban)) {
        console.log('no permission: ban rule');
        return false;
    }
    if (to.meta.rank !== undefined && !to.meta.rank.includes(rank)) {
        console.log('no permission: rank rule', rank);
        return false;
    }
    if (to.meta.needLogin !== undefined && to.meta.needLogin && !user) {
        console.log('no permission: login rule', user);
        return false;
    }
    if (to.meta.rule !== undefined && !permission.allowed) {
        console.log('no permission: permission rule');
        return false;
    }
    return true;
}

router.beforeEach(async (to, from, next) => {
    console.log('路由跳转', to);
    // 加载用户和权限配置
    if (!authStore) {
        authStore = useAuthStore();
        await authStore.init();
    }
    // 权限检查
    if (!hasPermission(to))
        return next('/403');
    return next();
});

export default router;
