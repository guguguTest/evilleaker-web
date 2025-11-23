import request from '../index'

// 查分服务器列表
export function getServerList() {
    return request.get('/api/ccb/servers');
}
