// src/main.js
import './assets/main.css';

import {createApp} from 'vue';
import {createPinia} from 'pinia';

import App from './App.vue';
import router from './router';
import i18n from './locales';

// 关键：引入消息工具，并挂到 window，兼容老代码
import {
    showSuccessMessage,
    showErrorMessage,
    showInfoMessage,
} from '@/utils/message';

if (typeof window !== 'undefined') {
    window.showSuccessMessage = showSuccessMessage;
    window.showErrorMessage = showErrorMessage;
    window.showInfoMessage = showInfoMessage;
}

const app = createApp(App);

app.use(createPinia());
app.use(router);
app.use(i18n);

app.mount('#app');
