import {createRouter, createWebHashHistory} from 'vue-router';
import {useAuthStore} from '@/stores/auth';
import base from '@/router/base';
import admin from '@/router/admin';
import functions from '@/router/functions';

const routes = [
    ...base,
    ...functions,
    ...admin,
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
