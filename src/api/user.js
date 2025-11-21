import request from './index'

// 登录
export function login(data) {
    return request.post('/api/login', data)
}
