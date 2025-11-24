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
                name: 'Ccb',
                path: '/ccb',
                component: () => import('@/views/404.vue'),
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
                component: () => import('@/views/404.vue'),
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