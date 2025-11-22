// src/api/user.js
import request from './index'

// 登录
export function login(data) {
    // data: { login, password }
    return request.post('/api/login', data)
}

// 注册
export function register(data) {
    // data: { username, password, nickname, email, verificationCode }
    return request.post('/api/register', data)
}

// 发送验证码（注册 / 找回密码共用）
export function sendVerificationCode({email, type}) {
    // type: 'register' | 'reset'
    return request.post('/api/send-verification-code', {email, type})
}

// 验证验证码（找回密码时使用）
export function verifyCode({email, code, type}) {
    // type: 'reset'
    return request.post('/api/verify-code', {email, code, type})
}

// 重置密码
export function resetPassword({resetToken, newPassword}) {
    return request.post('/api/reset-password', {resetToken, newPassword})
}

// 登出
export function logout() {
    return request.post('/api/logout')
}

export function getUserInfo() {
    return request.get('/api/user')
}