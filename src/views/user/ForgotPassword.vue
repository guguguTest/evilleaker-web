<!-- src/views/user/ForgotPassword.vue -->
<script setup>
import { ref, onBeforeUnmount } from 'vue'
import { useRouter } from 'vue-router'
import { sendVerificationCode, verifyCode } from '@/api/user'
import { showSuccessMessage } from '@/utils/messageBox'   // ✅ 只保留成功弹窗

const router = useRouter()

const form = ref({
  email: '',
  code: ''
})

const error = ref('')
const sending = ref(false)
const countdown = ref(0)
let timer = null

const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/

function setError(msg) {
  error.value = msg || ''
}

function goBack() {
  router.push('/login')
}

function startCountdown() {
  countdown.value = 60
  if (timer) clearInterval(timer)
  timer = setInterval(() => {
    countdown.value -= 1
    if (countdown.value <= 0) {
      clearInterval(timer)
      timer = null
    }
  }, 1000)
}

async function onSendCode() {
  if (sending.value || countdown.value > 0) return

  const email = form.value.email.trim()
  if (!email) {
    setError('邮箱不能为空')
    return
  }
  if (!emailRegex.test(email)) {
    setError('邮箱格式不正确')
    return
  }

  setError('')
  sending.value = true
  try {
    await sendVerificationCode({ email, type: 'reset' })
    startCountdown()
    // ✅ 只有这里弹窗
    showSuccessMessage('验证码已发送至您的邮箱')
  } catch (e) {
    const msg = e?.response?.data?.error || e.message || '发送验证码失败'
    setError(msg)                // ❌ 不弹窗
  } finally {
    sending.value = false
  }
}

async function onVerify() {
  setError('')
  const email = form.value.email.trim()
  const code = form.value.code.trim()

  if (!email || !code) {
    setError('邮箱和验证码不能为空')
    return
  }

  try {
    const res = await verifyCode({ email, code, type: 'reset' })
    if (!res || !res.success) {
      const msg = res?.error || '验证码验证失败'
      setError(msg)              // ❌ 不弹窗
      return
    }

    if (res.resetToken) {
      localStorage.setItem('resetToken', res.resetToken)
    }
    // 验证成功直接跳下一步，不弹窗
    router.push('/reset-password')
  } catch (e) {
    const msg = e?.response?.data?.error || e.message || '验证码验证失败'
    setError(msg)                // ❌ 不弹窗
  }
}

onBeforeUnmount(() => {
  if (timer) clearInterval(timer)
})
</script>

<template>
  <div class="auth-container">
    <h1 class="page-title">{{ $t('auth.resetPassword') }}</h1>

    <button class="back-button" data-page="login" type="button" @click="goBack">
      <i class="fas fa-arrow-left me-2"></i>
      <span>{{ $t('auth.back') }}</span>
    </button>

    <div class="auth-form">
      <div class="form-group">
        <label for="forgot-email">{{ $t('auth.email') }}</label>
        <input
            id="forgot-email"
            v-model="form.email"
            type="email"
            class="form-control"
            required
        />
      </div>

      <div class="form-group">
        <label for="forgot-verification-code">{{ $t('auth.verificationCode') }}</label>
        <div class="verification-code-group">
          <input
              id="forgot-verification-code"
              v-model="form.code"
              type="text"
              class="form-control"
              required
          />
          <button
              id="send-reset-code"
              class="btn btn-outline-secondary"
              type="button"
              :disabled="sending || countdown > 0"
              @click="onSendCode"
          >
            <span v-if="!countdown">{{ $t('auth.getVerificationCode') }}</span>
            <span v-else>{{ $t('auth.getVerificationCode') }} ({{ countdown }}s)</span>
          </button>
        </div>
      </div>

      <button
          id="verify-code-btn"
          class="auth-btn"
          type="button"
          @click="onVerify"
      >
        {{ $t('auth.verify') }}
      </button>

      <div
          id="forgot-error"
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
