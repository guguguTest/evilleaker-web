<script setup>

</script>

<template>
    <div class="auth-container">
        <h1 class="page-title">{{ $t('auth.resetPassword') }}</h1>
        <button class="back-button" data-page="login">
            <i class="fas fa-arrow-left me-2"></i>
            <span>{{ $t('auth.back') }}</span>
        </button>
        <div class="auth-form">
            <div class="form-group">
                <label for="forgot-email">{{ $t('auth.email') }}</label>
                <input type="email" id="forgot-email" class="form-control" required>
            </div>
            <div class="form-group">
                <label for="forgot-verification-code">{{ $t('auth.verificationCode') }}</label>
                <div class="verification-code-group">
                    <input type="text" id="forgot-verification-code" class="form-control" required>
                    <button id="send-reset-code" class="btn btn-outline-secondary">
                        {{ $t('auth.getVerificationCode') }}
                    </button>
                </div>
            </div>
            <button id="verify-code-btn" class="auth-btn">{{ $t('auth.verify') }}</button>
            <div id="forgot-error" class="error-message" style="display: none;"></div>
        </div>
    </div>
</template>

<style scoped>

</style>