import {PRESET_ALL, PRESET_LOGIN_BS0, PRESET_LOGIN_BS1} from '@/router/preset';

// 第一个没名字的栏目
export default [
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
                    rule: 'home'
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
                    ...PRESET_LOGIN_BS1,
                    hidden: true,
                    rule: 'user-settings'
                }
            },
            // 下载
            {
                name: 'Download',
                path: '/download',
                component: () => import('../views/Download.vue'),
                meta: {
                    ...PRESET_LOGIN_BS1,
                    title: 'sidebar.download',
                    icon: 'fas fa-download me-2',
                    rule: 'download'
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
                    ...PRESET_LOGIN_BS1,
                    title: 'sidebar.tools',
                    icon: 'fas fa-edit me-2',
                    rule: 'tools'
                }
            },
            // 补丁工具
            {
                name: 'Patcher',
                path: '/patcher',
                component: () => import('@/views/404.vue'),
                meta: {
                    ...PRESET_LOGIN_BS1,
                    title: 'sidebar.patcher',
                    icon: 'fas fa-plug me-2',
                    rule: 'dllpatcher'
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
                    rule: 'settings'
                }
            },
            // 用户认证
            {
                name: 'UserVerification',
                path: '/user-verification',
                component: () => import('@/views/404.vue'),
                meta: {
                    ...PRESET_LOGIN_BS0,
                    title: 'sidebar.userVerification',
                    icon: 'fas fa-user-shield me-2',
                    rule: 'user-verification'
                },
            },
        ]
    }
];