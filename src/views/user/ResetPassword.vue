<script setup>

</script>

<template>
    <div class="auth-container">
        <h1 class="page-title" >{{$t('auth.resetPassword')}}</h1>
        <div class="auth-form">
            <div class="form-group">
                <label for="reset-new-password" >{{ $t('auth.newPassword')}}</label>
                <input type="password" id="reset-new-password" class="form-control" required>
            </div>
            <div class="form-group">
                <label for="reset-confirm-password" >{{$t('auth.confirmPassword')}}</label>
                <input type="password" id="reset-confirm-password" class="form-control" required>
            </div>
            <button id="reset-password-btn" class="auth-btn" >{{$t('auth.resetPassword')}}</button>
            <div id="reset-error" class="error-message" style="display: none;"></div>
        </div>
    </div>
</template>

<style scoped>

</style>