// src/api/download.js
import request from './index';

// 检查当前用户是否有权限访问下载页
export function checkDownloadPermission() {
    return request.get('/api/check-permission', {
        params: { page: 'download' },
    });
}

// 获取下载列表（所有分类）
export function fetchDownloads() {
    return request.get('/api/downloads');
}

// 下载详情
export function fetchDownloadDetail(id) {
    return request.get(`/api/downloads/${id}`);
}

// 访问某个下载资源（扣积分等逻辑）
export function accessDownload(id) {
    return request.post(`/api/downloads/${id}/access`);
}

// 获取文件直链下载 token
export function createDownloadFileToken(fileId) {
    return request.post(`/api/download-files/${fileId}/token`);
}
