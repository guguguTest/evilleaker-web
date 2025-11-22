import {defineStore} from 'pinia';
import {ref, watch} from 'vue';
import {login as apiLogin, logout as apiLogout} from '@/api/user';
import {getPermissionsMe} from '@/api/permissions';

export const useAuthStore = defineStore('auth', () => {
    const token = ref('');
    const refreshToken = ref('');
    const user = ref(null);
    const permissions = ref({});

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
        localStorage.setItem('user', JSON.stringify(val));
    }

    function clearUser() {
        user.value = null;
        localStorage.removeItem('user');
    }

    function clearPermissions() {
        permissions.value = {};
    }

    async function refreshPermissions() {
        if (token.value)
            permissions.value = await getPermissionsMe();
    }

    function hasPermission(role) {
        if (!user.value)
            return false;
        return permissions.value[role];
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

    // 监听Token变化, 如果变了就重新加载权限
    watch(token, async (val) => {
        await refreshPermissions();
    });

    let tmp;
    tmp = localStorage.getItem('token');
    setToken(tmp ? tmp : '');
    tmp = localStorage.getItem('refreshToken');
    setRefreshToken(tmp ? tmp : '');
    tmp = localStorage.getItem('user');
    setUser(tmp ? JSON.parse(tmp) : null);


    return {
        token,
        login,
        logout,
        setToken,
        clearToken,
        refreshToken,
        setRefreshToken,
        clearRefreshToken,
        user,
        setUser,
        clearUser,
        permissions,
        hasPermission
    };
});
