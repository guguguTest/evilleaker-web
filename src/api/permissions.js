import request from './index';

export function getPermissionsMe() {
    return request.get('/api/admin/users/permissions/me');
}
