import {defineStore} from 'pinia';
import {ref, watch} from 'vue';
import {getUserInfo, login as apiLogin, logout as apiLogout} from '@/api/user';
import {getPermissionsMe} from '@/api/permissions';

export const useAuthStore = defineStore('auth', () => {
    const token = ref('');
    const refreshToken = ref('');
    const user = ref(null);
    const permissions = ref(null);

    function setToken(val) {
        token.value = val;
        localStorage.setItem('token', val);
    }

    function clearToken() {
        token.value = '';
        localStorage.removeItem('token');
    }

    function setRefreshToken(val) {
        refreshToken.value = val;
        localStorage.setItem('refreshToken', val);
    }

    function clearRefreshToken() {
        refreshToken.value = '';
        localStorage.removeItem('refreshToken');
    }

    function setUser(val) {
        user.value = val;
    }

    async function refreshUser() {
        if (token.value)
            setUser(await getUserInfo());
    }

    function clearUser() {
        user.value = null;
    }

    function setPermissions(val) {
        permissions.value = val;
    }

    function clearPermissions() {
        permissions.value = {};
    }

    async function refreshPermissions() {
        if (token.value)
            setPermissions(await getPermissionsMe());
    }

    function hasPermission(rule) {
        // 没有后端权限表或者后端权限表不全的时候，默认允许
        if (!permissions.value || !rule)
            return {allowed: true, visible: true};
        const p = permissions.value[rule];
        if (p === undefined)
            return {allowed: true, visible: true};
        return {allowed: !!p.allowed, visible: !!p.visible};
    }

    async function login(account, password) {
        const res = await apiLogin({login: account, password});
        if (!res.token || !res.user)
            throw new Error(res.error || '登录失败');
        setUser(res.user);
        setToken(res.token);
        setRefreshToken(res.refreshToken);
        return res.user;
    }

    async function logout() {
        await apiLogout();
        clearUser();
        clearToken();
        clearRefreshToken();
        clearPermissions();
    }

    async function init(force = false) {
        // 刷新用户和权限配置
        if (force || !permissions.value || !user.value) {
            await refreshUser();
            await refreshPermissions();
        }
    }

    // 读取Token
    let tmp;
    tmp = localStorage.getItem('token');
    setToken(tmp ? tmp : '');
    tmp = localStorage.getItem('refreshToken');
    setRefreshToken(tmp ? tmp : '');

    // 监听Token变化
    watch(token, async () => {
        console.log('token变化');
        await init();
    });

    return {
        // 三个值
        user,
        token,
        refreshToken,
        permissions,
        // 函数
        init,

        login,
        logout,

        setToken,
        clearToken,

        setRefreshToken,
        clearRefreshToken,

        setPermissions,
        refreshPermissions,
        clearPermissions,
        hasPermission,

        setUser,
        refreshUser,
        clearUser,
    };
});
