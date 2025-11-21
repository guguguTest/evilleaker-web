<script setup>

</script>

<template>
    <div class="section">
        <div class="login-required-container">
            <div class="login-required-icon">
                <i class="fas fa-ban"></i>
            </div>
            <h2>404 Not Found</h2>
            <p>找不到该页面</p>
            <router-link to="/home" custom v-slot="{ navigate }">
                <button class="login-btn" @click="navigate">
                    <i class="fas fa-sign-in-alt me-2"></i>
                    返回首页
                </button>
            </router-link>
        </div>
    </div>
</template>
