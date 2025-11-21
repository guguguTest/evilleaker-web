<script setup>
import {ref} from 'vue';
import {useRouter} from 'vue-router';
import {login} from '@/api/user';
import {useAuthStore} from '@/stores/auth';
import SuccessAnimation from '@/components/SuccessAnimation.vue';

const router = useRouter();
const authStore = useAuthStore();

const form = ref({
    login: '',
    password: ''
});
const error = ref('');
const succAniRef = ref(null);

let timer = null;

function onLoginBtn() {
    if (!form.value.login || !form.value.password)
        showError('用户名/邮箱和密码不能为空');
    login(form.value).then((res) => {
        console.log('登录成功:', res);
        if (res.token && res.user) {
            authStore.setToken(res.token);
            authStore.setRefreshToken(res.refreshToken);
            authStore.setUser(res.user);
            // 加载成功动画
            succAniRef.value.show({
                title: '登录成功',
                message: `欢迎回来，${res.user.nickname || res.user.username}！`,
                duration: 2500,
                callback: () => {
                    router.push('/');
                }
            });
        } else {
            showError(res.error || '登录失败');
        }
    }).catch((err) => {
        let msg = '登录失败';
        if (err.status === 401) {
            msg = '用户名或密码错误';
        } else if (err.status === 500) {
            msg = '服务器内部错误，请稍后再试';
        }
        showError(msg);
    });
}

function showError(message, time = 3000) {
    error.value = message;
    if (timer)
        clearTimeout(timer);
    timer = setTimeout(() => {
        error.value = '';
    }, time);
}
</script>

<template>
    <div class="auth-container">
        <h1 class="page-title">{{ $t('auth.login') }}</h1>
        <button class="back-button" data-page="home">
            <i class="fas fa-arrow-left me-2"></i>
            <span>{{ $t('auth.back') }}</span>
        </button>
        <div class="auth-form">
            <div class="form-group">
                <label for="login-username">{{ $t('auth.usernameOrEmail') }}</label>
                <input type="text" id="login-username" class="form-control" v-model="form.login" required>
            </div>
            <div class="form-group">
                <label for="login-password">{{ $t('auth.password') }}</label>
                <input type="password" id="login-password" class="form-control" v-model="form.password" required>
            </div>
            <button id="login-btn" class="auth-btn" @click="onLoginBtn">{{ $t('auth.login') }}</button>
            <div class="auth-footer">
                <span>
                    <span>{{ $t('auth.noAccount') }}</span>
                    <router-link to="/register" custom v-slot="{ navigate, href }">
                        <a :href="href" data-page="register" @click="navigate">{{ $t('auth.registerNow') }}</a>
                    </router-link>
                </span>
                <span class="forgot-password">
                    <router-link to="/forgot-password" custom v-slot="{ navigate, href }">
                        <a :href="href" data-page="forgot-password" @click="navigate">
                            {{ $t('auth.forgotPassword') }}
                        </a>
                    </router-link>
                </span>
            </div>
            <div id="login-error" class="error-message" v-if="error">{{ error }}</div>
        </div>
    </div>
    <success-animation ref="succAniRef"/>
</template>
