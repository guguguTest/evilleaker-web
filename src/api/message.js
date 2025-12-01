// src/api/message.js
import request from './index';

// ========= 未读 & 最近 =========

// 未读消息数量
export function getUnreadCount() {
    return request.get('/api/messages/unread-count');
}

// 下拉用最近 10 条消息
export function getRecentMessages() {
    return request.get('/api/messages/recent');
}

// ========= 消息中心列表 =========

// 消息中心列表（page / limit）
export function getMessageList(params) {
    return request.get('/api/messages', { params });
}

// 单条详情
export function getMessageDetail(id) {
    return request.get(`/api/messages/${id}`);
}

// 标记单条为已读
export function markMessageRead(id) {
    return request.put(`/api/messages/${id}/read`);
}

// 标记全部为已读
export function markAllMessagesRead() {
    return request.put('/api/messages/mark-all-read');
}

// 删除一条
export function deleteMessage(id) {
    return request.delete(`/api/messages/${id}`);
}

// 批量删除
export function batchDeleteMessages(ids) {
    return request.post('/api/messages/batch-delete', {
        message_ids: ids,
    });
}

// ========= 聊天会话 =========

// 会话（好友聊天窗口）
export function getConversation(userId) {
    return request.get(`/api/messages/conversation/${userId}`);
}

// 发送消息（聊天 / 站内信）
export function sendMessage(data) {
    // data: { recipient_id, content, message_type? }
    return request.post('/api/messages/send', data);
}
