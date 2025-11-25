// src/api/ccb.js
// 说明：统一经由这里访问后端；需要项目里已配置 base（如 axios 实例）。
// 如你们项目有 axios 封装，请把 fetch 换成 request 实例，并移除 authHeaders。

const BASE = '/api';

function authHeaders(includeJson = false) {
    const token = localStorage.getItem('token') || '';
    return {
        Authorization: `Bearer ${token}`,
        ...(includeJson ? { 'Content-Type': 'application/json' } : {}),
    };
}

// 用户信息（用于积分/绑定读入）
export async function apiGetUser() {
    const res = await fetch(`${BASE}/user`, { headers: authHeaders() });
    if (!res.ok) throw new Error('获取用户信息失败');
    return res.json();
}

// 服务器/游戏列表
export async function apiListServers() {
    const res = await fetch(`${BASE}/ccb/servers`);
    if (!res.ok) throw new Error('加载服务器列表失败');
    return res.json();
}
export async function apiListGames() {
    const res = await fetch(`${BASE}/ccb/games`);
    if (!res.ok) throw new Error('加载游戏列表失败');
    return res.json();
}

// 绑定/解绑/切换
export async function apiBindCard({ slot, game_server, keychip, guid }) {
    const res = await fetch(`${BASE}/ccb/bind`, {
        method: 'POST',
        headers: authHeaders(true),
        body: JSON.stringify({ slot, game_server, keychip, guid }),
    });
    const data = await res.json();
    if (!res.ok || !data.success) throw new Error(data.error || '绑定失败');
    return data;
}

export async function apiUnbindCard(slot) {
    const res = await fetch(`${BASE}/ccb/unbind`, {
        method: 'POST',
        headers: authHeaders(true),
        body: JSON.stringify({ slot }),
    });
    const data = await res.json();
    if (!res.ok || !data.success) throw new Error(data.error || '解绑失败');
    return data;
}

export async function apiUnbindAll() {
    const res = await fetch(`${BASE}/ccb/unbind-all`, {
        method: 'POST',
        headers: authHeaders(true),
        body: JSON.stringify({}),
    });
    const data = await res.json();
    if (!res.ok || !data.success) throw new Error(data.error || '解绑失败');
    return data;
}

export async function apiSwitchActive(slot) {
    const res = await fetch(`${BASE}/ccb/switch`, {
        method: 'POST',
        headers: authHeaders(true),
        body: JSON.stringify({ slot }),
    });
    const data = await res.json();
    if (!res.ok || !data.success) throw new Error(data.error || '切换失败');
    return data;
}

// 查分
export async function apiQueryScore({ game, slot }) {
    const res = await fetch(`${BASE}/ccb/query`, {
        method: 'POST',
        headers: authHeaders(true),
        body: JSON.stringify({ game, slot }),
    });
    const data = await res.json();
    if (!res.ok || !data.success) throw new Error(data.error || '查询失败');
    return data; // { success: true, status: 'ok', image_base64: '...' }
}
