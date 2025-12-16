// src/api/forum.js
import request from './index';

// 标签（按分区获取）
export function getForumTags(sectionKey) {
    return request.get('/api/forum/tags', { params: { section: sectionKey } });
}

// 分区帖子列表
export function getForumPosts(sectionKey, params) {
    // params: { page, limit, keyword, tag_id }
    return request.get(`/api/forum/${sectionKey}/posts`, { params });
}

// 帖子详情 + 回复摘要
export function getForumPostDetail(postId) {
    return request.get(`/api/forum/posts/${postId}`);
}

// 某帖子的回复列表（如果后端是单独接口）
// 注意：如果后端已经在详情里把 replies 带回来，这个可以不用
export function getForumPostReplies(postId, params) {
    return request.get(`/api/forum/posts/${postId}/replies`, { params });
}

// 发表主题帖
export function createForumPost(sectionKey, data) {
    // data: { title, content, tag_id, reward_points, reward_credit, images, reply_disabled }
    return request.post(`/api/forum/${sectionKey}/posts`, data);
}

// 回复帖子
export function createForumReply(postId, data) {
    // data: { content, images }
    return request.post(`/api/forum/posts/${postId}/replies`, data);
}

// 编辑帖子
export function updateForumPost(postId, data) {
    return request.put(`/api/forum/posts/${postId}`, data);
}

// 删除回复
export function deleteForumReply(replyId) {
    return request.delete(`/api/forum/replies/${replyId}`);
}

// 编辑回复
export function updateForumReply(replyId, data) {
    return request.put(`/api/forum/replies/${replyId}`, data);
}

// 管理员 / 楼主采纳答案
export function acceptReply(postId, replyId) {
    return request.post(`/api/forum/posts/${postId}/accept/${replyId}`);
}

// 关闭帖子（禁止回复）
export function closePost(postId) {
    return request.post(`/api/forum/posts/${postId}/close`);
}

// 论坛图片上传
export function uploadForumImage(formData) {
    return request.post('/api/forum/upload-image', formData, {
        headers: {
            'Content-Type': 'multipart/form-data',
        },
    });
}

// 标记分区全部帖子为已读
export function markAllForumPostsAsRead(sectionKey) {
    return request.post(`/api/forum/${sectionKey}/mark-read`);
}
