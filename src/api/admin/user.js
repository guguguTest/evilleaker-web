import request from '../index'

// 用户列表 page=1 limit=50
export function getUserList(data) {
    return request.get('/api/admin/users', {
        params: data
    });
}

// 更新用户
export function updateUser(id, data) {
    return request.put(`/api/admin/users/${id}`, data);
}
