// src/router/index.js
import {createRouter, createWebHashHistory} from 'vue-router';

const routes = [
    {
        path: '/',
        name: 'index',
        redirect: '/home',
    },
    {
        path: '/home',
        name: 'Home',
        component: () => import('../views/Home.vue'),
    },

    // 用户相关
    {
        path: '/login',
        name: 'Login',
        component: () => import('../views/user/Login.vue'),
    },
    {
        path: '/register',
        name: 'Register',
        component: () => import('../views/user/Register.vue'),
    },
    {
        path: '/forgot-password',
        name: 'ForgotPassword',
        component: () => import('../views/user/ForgotPassword.vue'),
    },
    {
        path: '/reset-password',
        name: 'ResetPassword',
        component: () => import('../views/user/ResetPassword.vue'),
    },
    {
        path: '/user-settings',
        name: 'UserSettings',
        component: () => import('../views/user/UserSettings.vue'),
    },
    {
        path: '/download',
        name: 'Download',
        component: () => import('../views/Download.vue'),
    },
    {
        path: '/download-detail/:id',
        name: 'DownloadDetail',
        component: () => import('../views/DownloadDetail.vue'),
        props: true,
    },
    // 网页设置（侧边栏的 settings）
    {
        path: '/settings',
        name: 'Settings',
        component: () => import('../views/Settings.vue'),
    },

    // 404
    {
        path: '/:pathMatch(.*)*',
        name: '404',
        component: () => import('../views/404.vue'),
    },
];

const router = createRouter({
    history: createWebHashHistory(),
    routes,
});

export default router;
