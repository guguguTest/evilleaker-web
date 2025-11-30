// src/api/friends.js
import request from './index';

// 好友列表
export function getFriends() {
    return request.get('/api/friends');
}

// 黑名单
export function getBlacklist() {
    return request.get('/api/friends/blacklist');
}

// 好友请求列表
export function getFriendRequests() {
    return request.get('/api/friends/requests');
}

// 搜索用户（按 uid / 用户名 / 昵称）
export function searchUsers(keyword) {
    return request.get('/api/friends/search', {
        params: { q: keyword },
    });
}

// 发送好友请求（注意：这里要跟后端保持兼容，使用 receiver_id 字段）
export function sendFriendRequest(userId) {
    return request.post('/api/friends/request', {
        receiver_id: parseInt(userId, 10), // 与原版保持一致
        message: '',                       // 可选消息，先留空
    });
}

// 同意好友请求
export function acceptFriendRequest(requestId) {
    return request.post(`/api/friends/request/${requestId}/accept`);
}

// 拒绝好友请求
export function rejectFriendRequest(requestId) {
    return request.post(`/api/friends/request/${requestId}/reject`);
}

// 删除好友
export function removeFriend(userId) {
    return request.delete(`/api/friends/${userId}`);
}

// 加入黑名单
export function addToBlacklist(userId) {
    return request.post('/api/friends/blacklist', {
        user_id: userId,
    });
}

// 从黑名单移除
export function removeFromBlacklist(userId) {
    return request.delete(`/api/friends/blacklist/${userId}`);
}

// 获取好友隐私设置
export function getFriendPrivacy() {
    return request.get('/api/friends/privacy');
}

// 更新好友隐私设置
// data: { searchable_by, message_privacy }
export function updateFriendPrivacy(data) {
    return request.put('/api/friends/privacy', data);
}
