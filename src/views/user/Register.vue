<script setup>
import {useAuthStore} from '@/stores/auth';

const authStore = useAuthStore();
</script>

<template>
    <div class="auth-container">
        <h1 class="page-title">{{ $t('auth.register') }}</h1>
        <button class="back-button" data-page="home">
            <i class="fas fa-arrow-left me-2"></i>
            <span>{{ $t('auth.back') }}</span>
        </button>
        <div class="auth-form">
            <div class="form-group">
                <label for="register-username">{{ $t('auth.username') }}</label>
                <input type="text" id="register-username" class="form-control" required maxlength="20">
                <div class="char-counter"><span id="username-counter">0</span>/20</div>
            </div>
            <div class="form-group">
                <label for="register-email">{{ $t('auth.email') }}</label>
                <input type="email" id="register-email" class="form-control" required>
            </div>
            <div class="form-group">
                <label for="register-nickname">{{ $t('auth.nickname') }}</label>
                <input type="text" id="register-nickname" class="form-control" maxlength="20">
                <div class="char-counter"><span id="nickname-counter">0</span>/20</div>
            </div>
            <div class="form-group">
                <label for="register-password">{{ $t('auth.password') }}</label>
                <input type="password" id="register-password" class="form-control" required maxlength="16">
                <div class="char-counter"><span id="password-counter">0</span>/16</div>
            </div>
            <div class="form-group">
                <label for="register-confirm-password">{{ $t('auth.confirmPassword') }}</label>
                <input type="password" id="register-confirm-password" class="form-control" required maxlength="16">
            </div>
            <div class="form-group">
                <label for="register-verification-code">{{ $t('auth.verificationCode') }}</label>
                <div class="verification-code-group">
                    <input type="text" id="register-verification-code" class="form-control" required>
                    <button id="send-verification-code" class="btn btn-outline-secondary"
                    >{{ $t('auth.getVerificationCode') }}
                    </button>
                </div>
            </div>
            <button id="register-btn" class="auth-btn">{{ $t('auth.register') }}</button>
            <div class="auth-footer">
                <span>
                    <span>{{ $t('auth.hasAccount') }}</span>
                    <router-link to="/login" custom v-slot="{ navigate, href }">
                        <a :href="href" data-page="login" @click="navigate">{{ $t('auth.loginNow') }}</a>
                    </router-link>
                </span>
            </div>
            <div id="register-error" class="error-message" style="display: none;"></div>
        </div>
    </div>
</template>

<style scoped>

</style>