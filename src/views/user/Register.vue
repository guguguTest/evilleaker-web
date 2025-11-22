<!-- src/views/user/Register.vue -->
<script setup>
import { ref, onBeforeUnmount } from 'vue'
import { useRouter } from 'vue-router'
import { useAuthStore } from '@/stores/auth'
import { register as apiRegister, sendVerificationCode } from '@/api/user'
import { showSuccessMessage } from '@/utils/message'   // ✅ 只保留成功弹窗

const router = useRouter()
const authStore = useAuthStore()

const form = ref({
  username: '',
  email: '',
  nickname: '',
  password: '',
  confirmPassword: '',
  verificationCode: ''
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
  router.push('/home')
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
    await sendVerificationCode({ email, type: 'register' })
    startCountdown()
    // ✅ 只有这里弹窗
    showSuccessMessage('验证码已发送至您的邮箱')
  } catch (e) {
    const msg = e?.response?.data?.error || e.message || '发送验证码失败'
    setError(msg)              // ❌ 不再弹窗，只用红色错误框
  } finally {
    sending.value = false
  }
}

async function onSubmit() {
  setError('')
  const { username, email, nickname, password, confirmPassword, verificationCode } = form.value

  if (!username || !email || !password || !confirmPassword || !verificationCode) {
    setError('用户名、邮箱、密码和验证码不能为空')
    return
  }

  if (username.length < 6 || username.length > 20) {
    setError('用户名长度需在6-20个字符之间')
    return
  }

  if (nickname && (nickname.length < 2 || nickname.length > 12)) {
    setError('昵称长度需在2-12个字符之间')
    return
  }

  if (!emailRegex.test(email)) {
    setError('邮箱格式不正确')
    return
  }

  if (password.length < 8 || password.length > 16) {
    setError('密码长度需在8-16个字符之间')
    return
  }

  if (password !== confirmPassword) {
    setError('两次输入的密码不一致')
    return
  }

  try {
    const res = await apiRegister({
      username,
      password,
      nickname,
      email,
      verificationCode
    })

    if (!res || !res.success) {
      const msg = res?.error || '注册失败'
      setError(msg)            // ❌ 不弹窗
      return
    }

    authStore.setToken(res.token || '')
    if (res.refreshToken) {
      authStore.setRefreshToken(res.refreshToken)
    }
    authStore.setUser(res.user || null)

    // 成功后直接跳转，不弹窗
    router.push('/home')
  } catch (e) {
    const msg = e?.response?.data?.error || e.message || '注册失败'
    setError(msg)              // ❌ 不弹窗
  }
}

onBeforeUnmount(() => {
  if (timer) clearInterval(timer)
})
</script>

<template>
  <div class="auth-container">
    <h1 class="page-title">{{ $t('auth.register') }}</h1>

    <button class="back-button" data-page="home" type="button" @click="goBack">
      <i class="fas fa-arrow-left me-2"></i>
      <span>{{ $t('auth.back') }}</span>
    </button>

    <div class="auth-form">
      <div class="form-group">
        <label for="register-username">{{ $t('auth.username') }}</label>
        <input
            id="register-username"
            v-model="form.username"
            type="text"
            class="form-control"
            required
            maxlength="20"
        />
        <div class="char-counter">
          <span id="username-counter">{{ form.username.length }}</span>/20
        </div>
      </div>

      <div class="form-group">
        <label for="register-email">{{ $t('auth.email') }}</label>
        <input
            id="register-email"
            v-model="form.email"
            type="email"
            class="form-control"
            required
        />
      </div>

      <div class="form-group">
        <label for="register-nickname">{{ $t('auth.nickname') }}</label>
        <input
            id="register-nickname"
            v-model="form.nickname"
            type="text"
            class="form-control"
            maxlength="20"
        />
        <div class="char-counter">
          <span id="nickname-counter">{{ form.nickname.length }}</span>/20
        </div>
      </div>

      <div class="form-group">
        <label for="register-password">{{ $t('auth.password') }}</label>
        <input
            id="register-password"
            v-model="form.password"
            type="password"
            class="form-control"
            required
            maxlength="16"
        />
        <div class="char-counter">
          <span id="password-counter">{{ form.password.length }}</span>/16
        </div>
      </div>

      <div class="form-group">
        <label for="register-confirm-password">{{ $t('auth.confirmPassword') }}</label>
        <input
            id="register-confirm-password"
            v-model="form.confirmPassword"
            type="password"
            class="form-control"
            required
            maxlength="16"
        />
      </div>

      <div class="form-group">
        <label for="register-verification-code">{{ $t('auth.verificationCode') }}</label>
        <div class="verification-code-group">
          <input
              id="register-verification-code"
              v-model="form.verificationCode"
              type="text"
              class="form-control"
              required
          />
          <button
              id="send-verification-code"
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
          id="register-btn"
          class="auth-btn"
          type="button"
          @click="onSubmit"
      >
        {{ $t('auth.register') }}
      </button>

      <div class="auth-footer">
        <span>
          <span>{{ $t('auth.hasAccount') }}</span>
          <router-link to="/login" custom v-slot="{ navigate, href }">
            <a :href="href" data-page="login" @click="navigate">
              {{ $t('auth.loginNow') }}
            </a>
          </router-link>
        </span>
      </div>

      <div
          id="register-error"
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
