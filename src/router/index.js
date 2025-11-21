import {createRouter, createWebHashHistory} from 'vue-router'

const router = createRouter({
    history: createWebHashHistory(),
    routes: [
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
            path: '/:pathMatch(.*)*',
            name: '404',
            component: () => import('../views/404.vue'),
        }
    ],
})

export default router
