// src/api/fortune.js
import request from '@/api/index';
import {useAuthStore} from '@/stores/auth';

export function getLastDraw() {
    const auth = useAuthStore();
    return request.get('/api/fortune/last-draw', {
        headers: { Authorization: `Bearer ${auth.token}` }
    });
}

export function drawFortune() {
    const auth = useAuthStore();
    return request.post('/api/fortune/draw', {}, {
        headers: { Authorization: `Bearer ${auth.token}` }
    });
}