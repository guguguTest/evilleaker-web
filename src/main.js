// src/main.js
import './assets/main.css'
import 'element-plus/theme-chalk/src/index.scss'

import { createApp } from 'vue'
import { createPinia } from 'pinia'
import ElementPlus from 'element-plus'
import zhCn from 'element-plus/es/locale/lang/zh-cn'
import * as ElIcons from '@element-plus/icons-vue'

import App from './App.vue'
import router from './router'
import i18n from './locales'

const app = createApp(App)

// 全量注册 Element Plus 图标（避免各处重复导入）
for (const [name, comp] of Object.entries(ElIcons)) {
    app.component(name, comp)
}

app.use(createPinia())
app.use(router)
app.use(i18n)
app.use(ElementPlus, { locale: zhCn })

app.mount('#app')
