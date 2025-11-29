// src/api/fortune.js
import request from '@/api/index';

export function getLastDraw() {
    return request.get('/api/fortune/last-draw');
}

export function drawFortune() {
    return request.post('/api/fortune/draw');
}