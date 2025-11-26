// src/api/tools.js
import request from '@/api/index';

// 获取工具列表
export function getTools() {
    return request.get('/api/tools');
}

// 获取单个工具详情
export function getToolById(id) {
    return request.get(`/api/tools/${id}`);
}

// 申请使用工具（会扣积分）
export function accessTool(id) {
    return request.post(`/api/tools/${id}/access`);
}