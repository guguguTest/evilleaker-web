<!-- src/views/user/ResetPassword.vue -->
<script setup>
import {ref} from 'vue'
import {useRouter} from 'vue-router'
import {resetPassword} from '@/api/user'

const router = useRouter()

const form = ref({
  password: '',
  confirmPassword: ''
})

const error = ref('')
const loading = ref(false)

function setError(msg) {
  error.value = msg || ''
}

async function onSubmit() {
  setError('')

  const resetToken = localStorage.getItem('resetToken')
  if (!resetToken) {
    setError('重置信息已过期，请重新执行找回密码。')
    router.push('/forgot-password')
    return
  }

  const {password, confirmPassword} = form.value

  if (!password || !confirmPassword) {
    setError('新密码和确认密码不能为空')
    return
  }

  if (password !== confirmPassword) {
    setError('两次输入的密码不一致')
    return
  }

  if (password.length < 8 || password.length > 16) {
    setError('密码长度需在8-16个字符之间')
    return
  }

  loading.value = true
  try {
    const res = await resetPassword({resetToken, newPassword: password})
    if (!res || !res.success) {
      setError(res?.error || '重置密码失败')
      return
    }

    localStorage.removeItem('resetToken')
    // 重置成功后回登录
    router.push('/login')
  } catch (e) {
    const msg = e?.response?.data?.error || e.message || '重置密码失败'
    setError(msg)
  } finally {
    loading.value = false
  }
}
</script>

<template>
  <div class="auth-container">
    <h1 class="page-title">{{ $t('auth.resetPassword') }}</h1>
    <div class="auth-form">
      <div class="form-group">
        <label for="reset-new-password">{{ $t('auth.newPassword') }}</label>
        <input
            id="reset-new-password"
            v-model="form.password"
            type="password"
            class="form-control"
            required
        />
      </div>

      <div class="form-group">
        <label for="reset-confirm-password">{{ $t('auth.confirmPassword') }}</label>
        <input
            id="reset-confirm-password"
            v-model="form.confirmPassword"
            type="password"
            class="form-control"
            required
        />
      </div>

      <button
          id="reset-password-btn"
          class="auth-btn"
          type="button"
          :disabled="loading"
          @click="onSubmit"
      >
        {{ $t('auth.resetPassword') }}
      </button>

      <div
          id="reset-error"
          class="error-message"
          v-if="error"
      >
        {{ error }}
      </div>
    </div>
  </div>
</template>

<style scoped>

</style>
