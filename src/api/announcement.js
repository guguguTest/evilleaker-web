import request from './index'

// 获得公告 page=1, limit=5
export function getAnnouncementList(data) {
    return request.get('/api/announcements', {
        params: data
    });
}

export function getAnnouncement(id) {
    return request.get(`/api/announcements/${id}`);
}
