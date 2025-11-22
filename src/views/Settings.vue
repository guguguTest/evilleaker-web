<!-- src/views/Settings.vue -->
<script setup>
import {ref, onMounted} from 'vue';
import {useI18n} from 'vue-i18n';
import {useI18nStore} from '@/stores/i18n';

// 多语言
const {t, locale} = useI18n();
const i18nStore = useI18nStore();

// 语言选项（注意这里用的是 vue 工程里的 zh / en / ja）
const languageOptions = [
  {value: 'zh', label: '简体中文'},
  {value: 'en', label: 'English'},
  {value: 'ja', label: '日本語'},
];

// 当前语言 & 记住语言
const selectedLanguage = ref(i18nStore.lang || locale.value || 'zh');
// const rememberLanguage = ref(localStorage.getItem('rememberLanguage') !== 'false');

// 鼠标样式
const cursorStyles = [
  {
    key: 'default',
    icon: 'fas fa-mouse-pointer',
    nameKey: 'settings.cursorDefault',
    descKey: 'settings.cursorDefaultDesc',
  },
  {
    key: 'custom1',
    icon: 'fas fa-gamepad',
    nameKey: 'settings.cursorCustom1',
    descKey: 'settings.cursorCustom1Desc',
  },
  {
    key: 'custom2',
    icon: 'fas fa-heart',
    nameKey: 'settings.cursorCustom2',
    descKey: 'settings.cursorCustom2Desc',
  },
];
const currentCursorStyle = ref(localStorage.getItem('cursorStyle') || 'default');

// 应用鼠标样式到 body
function applyCursorStyle(style) {
  if (typeof window === 'undefined') return;
  const body = document.body;
  body.classList.remove('cursor-default', 'cursor-custom1', 'cursor-custom2');
  body.classList.add('`cursor-`'.replace(/`/g, '') + style); // 防止模板引号被转义问题
}

// 选择鼠标样式（点击卡片时调用）
function selectCursorStyle(style) {
  currentCursorStyle.value = style;
  localStorage.setItem('cursorStyle', style);
  applyCursorStyle(style);

  // 使用全局或模块化的提示（如果有）
  // main.js 里可以把 showSuccessMessage 挂到 window（后面有说明）
  if (typeof window !== 'undefined' && window.showSuccessMessage) {
    window.showSuccessMessage(t('common.success'));
  }
}

// 保存语言相关设置（点击“保存设置”按钮）
function saveSettings() {
  // 切换语言
  i18nStore.setLocale(selectedLanguage.value);

  // // 记住语言偏好
  // if (rememberLanguage.value) {
  //   localStorage.setItem('rememberLanguage', 'true');
  //   // locale 已经在 store 里写入 localStorage('locale')
  // } else {
  //   localStorage.setItem('rememberLanguage', 'false');
  //   // 不希望下次自动记住，就把当前的 locale 存储清掉
  //   localStorage.removeItem('locale');
  // }

  if (typeof window !== 'undefined' && window.showSuccessMessage) {
    window.showSuccessMessage(t('common.success'));
  }
}

// ====== 缓存相关：直接调用原来的 emoji-cache.js 暴露的全局函数 ======
function refreshCacheStats() {
  if (typeof window !== 'undefined' && window.handleRefreshCacheStats) {
    window.handleRefreshCacheStats();
  }
}

function cleanOldCache() {
  if (typeof window !== 'undefined' && window.handleCleanOldCache) {
    window.handleCleanOldCache();
  }
}

function clearAllCache() {
  if (typeof window !== 'undefined' && window.handleClearAllCache) {
    window.handleClearAllCache();
  }
}

onMounted(() => {
  // 初始化鼠标样式
  applyCursorStyle(currentCursorStyle.value);

  // 初始化缓存面板（如果引入了原版的 emoji-cache.js）
  if (typeof window !== 'undefined' && window.initCacheSettings) {
    window.initCacheSettings();
  }
});
</script>

<template>
  <div class="settings-container">
    <!-- 标题 -->
    <h1 class="page-title" data-i18n="settings.title">
      {{ t('settings.title') || '设置' }}
    </h1>

    <!-- 语言设置卡片 -->
    <div class="setting-card">
      <div class="setting-header">
        <i class="fas fa-language me-2"></i>
        <span data-i18n="settings.language">
          {{ t('settings.language') || '语言设置' }}
        </span>
      </div>
      <div class="setting-body">
        <div class="form-group">
          <label
              for="language-select"
              data-i18n="settings.interfaceLanguage"
          >
            {{ t('settings.interfaceLanguage') || '界面语言' }}
          </label>
          <select
              id="language-select"
              class="form-control"
              v-model="selectedLanguage"
          >
            <option
                v-for="opt in languageOptions"
                :key="opt.value"
                :value="opt.value"
            >
              {{ opt.label }}
            </option>
          </select>
        </div>
<!--        <div class="setting-item">-->
<!--          <div>-->
<!--            <span data-i18n="settings.rememberLanguage">-->
<!--              {{ t('settings.rememberLanguage') || '记住语言偏好' }}-->
<!--            </span>-->
<!--            <div-->
<!--                class="setting-description"-->
<!--                data-i18n="settings.rememberLanguageDesc"-->
<!--            >-->
<!--              {{-->
<!--                t('settings.rememberLanguageDesc')-->
<!--                || '下次访问时自动使用您选择的语言'-->
<!--              }}-->
<!--            </div>-->
<!--          </div>-->
<!--          <label class="switch">-->
<!--            <input type="checkbox" v-model="rememberLanguage" />-->
<!--            <span class="slider"></span>-->
<!--          </label>-->
<!--        </div>-->
      </div>
    </div>

    <!-- 表情缓存管理卡片 -->
    <!-- 注意：这里基本保持原版 DOM 结构和 id，方便直接复用 emoji-cache.js -->
    <div class="setting-card" id="emoji-cache-card">
      <div class="setting-header">
        <i class="fas fa-database me-2"></i>
        <span data-i18n="settings.emojiCache">
          {{ t('settings.emojiCache') || '表情缓存管理' }}
        </span>
      </div>
      <div class="setting-body">
        <div class="cache-summary">
          <div class="cache-summary-text">
            <h3 data-i18n="settings.cacheSize">
              {{ t('settings.cacheSize') || '缓存大小' }}
            </h3>
            <p data-i18n="settings.used">
              {{ t('settings.used') || '已使用' }}
            </p>
          </div>
          <div class="cache-progress">
            <div class="ring-progress-container">
              <svg class="ring-progress-svg" viewBox="0 0 140 140">
                <defs>
                  <linearGradient
                      id="ring-gradient"
                      x1="0%"
                      y1="0%"
                      x2="100%"
                      y2="100%"
                  >
                    <stop offset="0%" style="stop-color:#667eea;stop-opacity:1" />
                    <stop offset="100%" style="stop-color:#764ba2;stop-opacity:1" />
                  </linearGradient>
                </defs>
                <circle
                    class="ring-progress-bg"
                    cx="70"
                    cy="70"
                    r="65"
                />
                <circle
                    class="ring-progress-fill"
                    id="ring-progress-fill"
                    cx="70"
                    cy="70"
                    r="65"
                />
              </svg>
              <div class="ring-progress-text">
                <span
                    class="ring-progress-percent"
                    id="ring-progress-percent"
                >
                  0%
                </span>
                <span
                    class="ring-progress-label"
                    data-i18n="settings.used"
                >
                  {{ t('settings.used') || '已使用' }}
                </span>
              </div>
            </div>
          </div>
          <div class="cache-progress-info">
            <span id="cache-usage-text">0.00 MB / 500 MB</span>
          </div>
        </div>

        <div class="cache-stats">
          <div class="cache-stat-item">
            <i class="far fa-smile"></i>
            <div>
              <div class="cache-stat-value" id="cache-emoji-count">0</div>
              <div
                  class="cache-stat-label"
                  data-i18n="settings.cachedEmoji"
              >
                {{ t('settings.cachedEmoji') || '已缓存表情' }}
              </div>
            </div>
          </div>
          <div class="cache-stat-item">
            <i class="fas fa-music"></i>
            <div>
              <div class="cache-stat-value" id="cache-audio-count">0</div>
              <div
                  class="cache-stat-label"
                  data-i18n="settings.cachedAudio"
              >
                {{ t('settings.cachedAudio') || '已缓存音频' }}
              </div>
            </div>
          </div>
          <div class="cache-stat-item">
            <i class="far fa-image"></i>
            <div>
              <div class="cache-stat-value" id="cache-message-count">0</div>
              <div
                  class="cache-stat-label"
                  data-i18n="settings.messageImages"
              >
                {{ t('settings.messageImages') || '消息图片' }}
              </div>
            </div>
          </div>
        </div>

        <div class="cache-actions">
          <button
              class="settings-btn settings-btn-primary"
              id="refresh-cache-stats"
              @click="refreshCacheStats"
          >
            <i class="fas fa-sync-alt me-2"></i>
            <span data-i18n="settings.refreshStats">
              {{ t('settings.refreshStats') || '刷新统计' }}
            </span>
          </button>
          <button
              class="settings-btn settings-btn-warning"
              id="clean-old-cache"
              @click="cleanOldCache"
          >
            <i class="fas fa-broom me-2"></i>
            <span data-i18n="settings.cleanOldCache">
              {{ t('settings.cleanOldCache') || '清理旧缓存' }}
            </span>
          </button>
          <button
              class="settings-btn settings-btn-danger"
              id="clear-all-cache"
              @click="clearAllCache"
          >
            <i class="fas fa-trash-alt me-2"></i>
            <span data-i18n="settings.clearAllCache">
              {{ t('settings.clearAllCache') || '清空所有缓存' }}
            </span>
          </button>
        </div>

        <div class="cache-settings">
          <div class="setting-item">
            <label class="settings-label">
              <input type="checkbox" id="auto-clean-cache" checked />
              <span data-i18n="settings.autoCleanCache">
                {{ t('settings.autoCleanCache') || '自动清理过期缓存' }}
              </span>
            </label>
          </div>
          <div class="setting-item">
            <label class="settings-label">
              <input type="checkbox" id="preload-emoji" checked />
              <span data-i18n="settings.preloadEmoji">
                {{ t('settings.preloadEmoji') || '预加载常用表情和音频' }}
              </span>
            </label>
          </div>
        </div>

        <div class="cache-status" id="cache-status"></div>
      </div>
    </div>

    <!-- 鼠标样式设置卡片 -->
    <div class="setting-card" id="cursor-settings-card">
      <div class="setting-header">
        <i class="fas fa-mouse-pointer me-2"></i>
        <span data-i18n="settings.cursorStyle">
          {{ t('settings.cursorStyle') || '鼠标样式' }}
        </span>
      </div>
      <div class="setting-body">
        <!-- PC 端提示 -->
        <div class="cursor-desktop-hint">
          <i class="fas fa-desktop me-2"></i>
          <span data-i18n="settings.cursorHint">
            {{ t('settings.cursorHint') || '鼠标样式设置仅在桌面设备上生效' }}
          </span>
        </div>

        <!-- 样式选项 -->
        <div class="cursor-preview" id="cursor-preview-container">
          <div
              v-for="style in cursorStyles"
              :key="style.key"
              class="cursor-option"
              :class="{active: currentCursorStyle === style.key}"
              :data-cursor="style.key"
              @click="selectCursorStyle(style.key)"
          >
            <div class="cursor-option-icon">
              <i :class="style.icon"></i>
            </div>
            <div class="cursor-option-name">
              {{ t(style.nameKey) }}
            </div>
            <div class="cursor-option-desc">
              {{ t(style.descKey) }}
            </div>
          </div>
        </div>

        <div class="cursor-loading-hint">
          <span data-i18n="settings.cursorLoadingHint">
            {{
              t('settings.cursorLoadingHint')
              || '提示：自定义鼠标样式需要加载额外资源，首次使用可能需要几秒钟加载'
            }}
          </span>
        </div>
      </div>
    </div>

    <!-- 保存按钮 -->
    <div class="settings-buttons">
      <button class="save-btn" id="save-settings" @click="saveSettings">
        <i class="fas fa-save me-2"></i>
        <span data-i18n="settings.saveSettings">
          {{ t('settings.saveSettings') || '保存设置' }}
        </span>
      </button>
    </div>
  </div>
</template>

<style scoped>
/* 如果需要，也可以在这里补一点小样式；大部分样式已经在 src/assets/css/spa.css / main.css 里了 */
</style>
