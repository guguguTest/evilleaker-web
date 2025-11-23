import {joinUrl} from '@/utils/misc.js';

export const baseUrl = import.meta.env.VITE_API_BASE_URL || '';
export const avatarUrl = joinUrl(baseUrl, '/avatars');
