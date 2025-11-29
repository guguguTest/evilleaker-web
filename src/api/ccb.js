// src/api/ccb.js
// 统一使用项目 axios 实例（已含 baseURL/withCredentials/拦截器）
import request from '@/api/index';

// 说明：你们响应拦截器已 `return res.data`，所以这里**不要**再解构 { data }。
// 直接返回 request 调用结果（即响应体）。

// 用户信息（积分/绑定读入）
export function apiGetUser() {
    return request.get('/api/user');
}

// 服务器/游戏列表（给到 15s 超时）
export function apiListServers() {
    return request.get('/api/ccb/servers', {timeout: 15000});
}

export function apiListGames() {
    return request.get('/api/ccb/games', {timeout: 15000});
}

// 绑定/解绑/切换 —— 统一在 4xx 时把后端的错误文案透传出来
function extractServerError(e, fallback) {
    const res = e?.response;
    const d = res?.data;
    if (typeof d === 'string' && d.trim()) return d;
    if (d && typeof d === 'object') {
        return (
            d.error ||
            d.message ||
            d.detail ||
            (Array.isArray(d.errors) && d.errors[0]) ||
            fallback
        );
    }
    return fallback;
}

export async function apiBindCard({slot, game_server, keychip, guid}) {
    try {
        const res = await request.post(
            '/api/ccb/bind',
            {slot, game_server, keychip, guid},
            {
                headers: {
                    'Content-Type': 'application/json'
                },
                timeout: 20000,
            }
        );
        if (!res?.success)
            throw new Error(res?.error || '绑定失败');
        return res;
    } catch (e) {
        const msg = extractServerError(e, '绑定失败');
        throw new Error(msg);
    }
}

export async function apiUnbindCard(slot) {
    try {
        const res = await request.post(
            '/api/ccb/unbind', {slot}, {timeout: 15000});
        if (!res?.success)
            throw new Error(res?.error || '解绑失败');
        return res;
    } catch (e) {
        const msg = extractServerError(e, '解绑失败');
        throw new Error(msg);
    }
}

export async function apiUnbindAll() {
    try {
        const res = await request.post(
            '/api/ccb/unbind-all',
            {},
            {timeout: 20000}
        );
        if (!res?.success) throw new Error(res?.error || '解绑失败');
        return res;
    } catch (e) {
        const msg = extractServerError(e, '解绑失败');
        throw new Error(msg);
    }
}

export async function apiSwitchActive(slot) {
    try {
        const res = await request.post(
            '/api/ccb/switch',
            {slot},
            {timeout: 15000}
        );
        if (!res?.success) throw new Error(res?.error || '切换失败');
        return res;
    } catch (e) {
        const msg = extractServerError(e, '切换失败');
        throw new Error(msg);
    }
}

// 查分（最慢，给 60s；支持 abort signal 取消）
export async function apiQueryScore({game, slot, signal}) {
    try {
        const res = await request.post(
            '/api/ccb/query',
            {game, slot},
            {timeout: 60000, signal}
        );
        if (!res?.success) throw new Error(res?.error || '查询失败');
        return res; // { success:true, status:'ok', image_base64:'...' }
    } catch (e) {
        const msg = extractServerError(e, '查询失败');
        // Axios 在 signal abort 时也会抛错，这里直接原样抛
        if (e?.code === 'ERR_CANCELED') throw e;
        throw new Error(msg);
    }
}
