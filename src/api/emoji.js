// src/api/emoji.js
import request from './index';

// 表情包列表
export function getEmojiPacks() {
    return request.get('/api/emoji/packs');
}

// 某个包里的表情
export function getEmojiItems(packId) {
    return request.get(`/api/emoji/pack/${packId}/items`);
}

// 最近使用
export function getRecentEmojis() {
    return request.get('/api/emoji/recent');
}

// 上报使用记录
export function reportEmojiUsage(emojiId) {
    return request.post('/api/emoji/usage', { emoji_id: emojiId });
}
