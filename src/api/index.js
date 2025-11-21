import axios from 'axios';
import {useAuthStore} from '@/stores/auth';

const baseURL = import.meta.env.VITE_API_BASE_URL || '/api'

const request = axios.create({
    baseURL,
    timeout: 5000,
    withCredentials: true,
    headers: {
        'Content-Type': 'application/json',
        'X-Requested-With': 'XMLHttpRequest'
    }
});

// 请求拦截器
request.interceptors.request.use(config => {
    const authStore = useAuthStore()
    if (authStore.token)
        config.headers.Authorization = `Bearer ${authStore.token}`
    return config;
}, error => {
    return Promise.reject(error);
});

// 响应拦截器
request.interceptors.response.use(res => {
    return res.data;
}, error => {
    console.error(error);
    return Promise.reject(error);
});

export default request;
