import {PRESET_LOGIN_BS0} from '@/router/preset';

// 功能栏
export default [
    {
        name: 'Functions',
        path: '/',
        meta: {title: 'sidebar.functions', icon: 'fas fa-cogs'},
        children: [
            {
                name: 'Fortune',
                path: '/fortune',
                component: () => import('@/views/Fortune.vue'),
                meta: {
                    ...PRESET_LOGIN_BS0,
                    title: 'sidebar.fortune',
                    icon: 'fas fa-star me-2',
                    rule: 'fortune'
                }
            },
            {
                name: 'Tools',
                path: '/tools',
                component: () => import('@/views/Tools.vue'),
                meta: {
                    // 只要能登录且 BS0 就能看（与其它功能页一致）
                    ...PRESET_LOGIN_BS0,
                    title: 'sidebar.tools',
                    icon: 'fas fa-tools me-2',
                    rule: 'tools'
                }
            },
            {
                name: 'Ccb',
                path: '/ccb',
                component: () => import('@/views/Ccb.vue'),
                meta: {
                    ...PRESET_LOGIN_BS0,
                    title: 'sidebar.ccb',
                    icon: 'fas fa-search me-2',
                    rule: 'ccb'
                }
            },
            {
                name: 'Forum',
                path: '/forum',
                component: () => import('@/views/Forum.vue'),
                meta: {
                    ...PRESET_LOGIN_BS0,
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
                    ...PRESET_LOGIN_BS0,
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
                    ...PRESET_LOGIN_BS0,
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
                    ...PRESET_LOGIN_BS0,
                    title: 'sidebar.minigame',
                    icon: 'fas fa-gamepad me-2',
                    rule: 'minigame'
                }
            }
        ]
    }
];