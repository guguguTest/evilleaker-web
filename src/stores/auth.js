import {defineStore} from 'pinia';
import {ref} from 'vue';

export const useAuthStore = defineStore('auth', () => {
    const token = ref('');
    const refreshToken = ref('');
    const user = ref(null);

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

    function clearAll() {
        clearToken();
        clearRefreshToken();
        clearUser();
    }

    let tmp;
    tmp = localStorage.getItem('token');
    setToken(tmp ? tmp : '');
    tmp = localStorage.getItem('user');
    setUser(tmp ? JSON.parse(tmp) : null);

    return {
        token,
        setToken,
        clearToken,
        refreshToken,
        setRefreshToken,
        clearRefreshToken,
        user,
        setUser,
        clearUser,
        clearAll
    };
});
