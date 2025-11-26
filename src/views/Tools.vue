<template>
  <div class="tools-showcase">
    <!-- 头部：标题 + 搜索 -->
    <div class="tools-header">
      <div class="flex items-center gap-3">
        <h1 class="page-title">实用工具</h1>
        <RouterLink to="/" class="back-button">
          <i class="fas fa-arrow-left me-2" />返回首页
        </RouterLink>
      </div>
      <div class="tools-search-container">
        <input
            v-model.trim="keyword"
            type="text"
            class="tools-search-input"
            placeholder="搜索工具..."
            aria-label="搜索工具"
        />
        <i class="fas fa-search tools-search-icon" />
      </div>
    </div>

    <!-- 加载中 -->
    <div v-if="loading" class="tools-loading">
      <div class="tools-spinner" />
    </div>

    <!-- 空态 -->
    <div v-else-if="filteredTools.length === 0" class="tools-empty-state">
      <div class="tools-empty-icon"><i class="fas fa-toolbox" /></div>
      <p class="tools-empty-text">暂无可用工具</p>
    </div>

    <!-- 工具网格 -->
    <div v-else class="tools-grid">
      <article
          v-for="tool in filteredTools"
          :key="tool.id"
          class="tool-item-card"
          :data-title="tool.title?.toLowerCase?.() || ''"
      >
        <header class="tool-item-header">
          <i :class="[tool.icon_class || 'fas fa-tools', 'tool-item-icon']" />
          <h3 class="tool-item-title">{{ tool.title }}</h3>
        </header>

        <div class="tool-item-body">
          <p class="tool-item-description">{{ tool.description || '暂无介绍' }}</p>

          <!-- meta 标签 -->
          <div v-if="metaTags(tool).length" class="tool-item-meta">
            <span v-for="(meta, i) in metaTags(tool)" :key="i" class="tool-meta-tag" :class="meta.class">
              <i :class="meta.icon" />
              <span>{{ meta.text }}</span>
            </span>
          </div>

          <!-- 操作按钮 -->
          <div class="tool-item-action">
            <button
                v-if="buttonState(tool).type === 'needLogin'"
                class="tool-action-btn disabled"
                type="button"
                @click="toLogin()"
            >
              <i class="fas fa-sign-in-alt" />
              <span>需要登录</span>
            </button>

            <button
                v-else-if="buttonState(tool).type === 'lackRank'"
                class="tool-action-btn disabled"
                type="button"
                @click="notify(`您的用户组权限不足，需要${rankName(tool.access_level)}或以上`)"
            >
              <i class="fas fa-lock" />
              <span>需要{{ rankName(tool.access_level) }}或以上</span>
            </button>

            <button
                v-else-if="buttonState(tool).type === 'lackSpecial'"
                class="tool-action-btn disabled"
                type="button"
                @click="notify(`需要${specialText(tool.special_group)}权限`)"
            >
              <i class="fas fa-user-lock" />
              <span>需要{{ specialText(tool.special_group) }}权限</span>
            </button>

            <button
                v-else-if="buttonState(tool).type === 'lackPoints'"
                class="tool-action-btn disabled"
                type="button"
                @click="notify(`积分不足，需要 ${tool.required_points} 积分，您当前有 ${userPoints} 积分`)"
            >
              <i class="fas fa-coins" />
              <span>需要 {{ tool.required_points }} 积分</span>
            </button>

            <button
                v-else
                class="tool-action-btn"
                type="button"
                @click="useTool(tool)"
            >
              <i :class="tool.tool_type === 'link' ? 'fas fa-download' : 'fas fa-arrow-right'" />
              <span>{{ tool.required_points > 0 ? (tool.tool_type === 'link' ? `下载 (-${tool.required_points}积分)` : `使用工具 (-${tool.required_points}积分)`) : (tool.tool_type === 'link' ? '下载' : '使用工具') }}</span>
            </button>
          </div>
        </div>
      </article>
    </div>

    <!-- 内嵌 Iframe 模式（仅 tool_type === 'page' 时使用） -->
    <div v-if="iframeMode" class="tool-iframe-container">
      <div class="tool-iframe-header">
        <div class="tool-iframe-info">
          <i :class="[currentTool?.icon_class || 'fas fa-tools', 'tool-iframe-icon']" />
          <h2 class="tool-iframe-title">{{ currentTool?.title }}</h2>
        </div>
        <div class="tool-iframe-actions">
          <button class="tool-iframe-refresh-btn" type="button" @click="refreshIframe">
            <i class="fas fa-sync-alt" />
            <span>刷新</span>
          </button>
          <button class="tool-iframe-back-btn" type="button" @click="closeIframe">
            <i class="fas fa-arrow-left" />
            <span>返回工具列表</span>
          </button>
        </div>
      </div>

      <div class="tool-iframe-wrapper">
        <iframe
            ref="toolIframeRef"
            class="tool-iframe-frame"
            :src="currentTool?.target_url"
            frameborder="0"
            allowfullscreen
            sandbox="allow-same-origin allow-scripts allow-popups allow-forms"
            @load="iframeLoading = false"
        />
        <div v-if="iframeLoading" class="tool-iframe-loading">
          <div class="tool-iframe-spinner" />
          <p>正在加载工具...</p>
        </div>
      </div>
    </div>
  </div>
</template>

<script setup>
import {computed, onMounted, ref} from 'vue';
import {useRouter} from 'vue-router';
import {useAuthStore} from '@/stores/auth';
import {getTools, getToolById, accessTool} from '@/api/tools';

const router = useRouter();
const auth = useAuthStore();

const loading = ref(true);
const keyword = ref('');
const tools = ref([]);

// iframe state
const iframeMode = ref(false);
const iframeLoading = ref(false);
const currentTool = ref(null);
const toolIframeRef = ref(null);

const user = computed(() => auth.user);
const userRank = computed(() => (user.value ? parseInt(user.value.user_rank) || 0 : 0));
const userSpecial = computed(() => (user.value && user.value.rankSp !== undefined ? String(user.value.rankSp) : null));
const userPoints = computed(() => (user.value ? parseInt(user.value.points) || 0 : 0));

onMounted(async () => {
  loading.value = true;
  try {
    tools.value = await getTools();
  } catch (e) {
    console.error('加载工具失败:', e);
  } finally {
    loading.value = false;
  }
});

const filteredTools = computed(() => {
  if (!keyword.value) return tools.value;
  const k = keyword.value.toLowerCase();
  return tools.value.filter(t => (t.title || '').toLowerCase().includes(k));
});

function rankName(level) {
  const rankNames = ['普通', '初级', '中级', '高级', '贵宾', '管理员'];
  return rankNames[level] || `Lv.${level}`;
}

function specialText(group) {
  if (!group) return '';
  if (String(group) === '1') return 'maimoller';
  if (String(group) === '2') return '协同管理员';
  return `特殊组${group}`;
}

function metaTags(tool) {
  const tags = [];
  if (tool.last_update) {
    tags.push({ icon: 'fas fa-clock', text: new Date(tool.last_update).toLocaleDateString('zh-CN') });
  }
  if (tool.tool_type === 'link' && tool.file_size) {
    tags.push({ icon: 'fas fa-file', text: tool.file_size });
  }
  if (tool.required_points > 0) {
    tags.push({ icon: 'fas fa-coins', text: `${tool.required_points} 积分`, class: 'meta-points' });
  }
  if (tool.access_level > 0 || tool.special_group) {
    const parts = [];
    if (tool.access_level > 0) parts.push(rankName(tool.access_level));
    if (tool.special_group) parts.push(specialText(tool.special_group));
    tags.push({ icon: 'fas fa-lock', text: parts.join('+'), class: 'meta-permission' });
  }
  return tags;
}

function buttonState(tool) {
  const hasPermReq = tool.access_level > 0 || tool.special_group || tool.required_points > 0;
  const needsLogin = !user.value && hasPermReq;
  if (needsLogin) return { type: 'needLogin' };

  if (user.value) {
    const isAdmin = userRank.value >= 5;
    const lackRank = tool.access_level > 0 && userRank.value < tool.access_level;
    let lackSpecial = false;
    if (tool.special_group && !isAdmin) {
      lackSpecial = String(tool.special_group).trim() !== (userSpecial.value ? String(userSpecial.value).trim() : '');
    }
    const lackPoints = tool.required_points > 0 && userPoints.value < tool.required_points;

    if (lackRank) return { type: 'lackRank' };
    if (lackSpecial) return { type: 'lackSpecial' };
    if (lackPoints) return { type: 'lackPoints' };
  }
  return { type: 'ok' };
}

function notify(msg) {
  // 统一提示占位，可替换为全局 Toast
  window.alert(msg);
}

function toLogin() {
  router.push('/user/login');
}

async function useTool(tool) {
  try {
    // 先获取工具信息
    const detail = await getToolById(tool.id);

    // 若需要积分，先扣除
    if (detail.required_points > 0 && auth.token) {
      const ok = window.confirm(`使用此工具需要消耗 ${detail.required_points} 积分，确定继续吗？`);
      if (!ok) return;

      const result = await accessTool(detail.id);
      // 规范：通过 store 的设置器更新（避免直接赋值）
      if (auth.user) {
        const newPoints = result?.new_points ?? (userPoints.value - detail.required_points);
        auth.setUser({ ...auth.user, points: newPoints });
      }
    }

    if (detail.tool_type === 'page') {
      // 内部页面 → iframe 模式
      currentTool.value = detail;
      iframeMode.value = true;
      iframeLoading.value = true;
    } else {
      // 外部链接 → 新窗口打开
      const url = detail.target_url;
      if (url) window.open(url, '_blank', 'noopener');
    }
  } catch (e) {
    console.error('使用工具失败:', e);
    notify(e?.response?.data?.error || e.message || '使用失败');
  }
}

function refreshIframe() {
  const el = toolIframeRef.value;
  if (el) {
    iframeLoading.value = true;
    // 重新加载
    el.src = el.src;
  }
}

function closeIframe() {
  iframeMode.value = false;
  iframeLoading.value = false;
  currentTool.value = null;
}
</script>

<style scoped>
/* =================== 工具展示页面样式（源 tools.css 的局部拷贝） =================== */
.tools-showcase { padding: 20px; max-width: 1400px; margin: 0 auto; }
.tools-header { display: flex; justify-content: space-between; align-items: center; margin-bottom: 30px; padding-bottom: 20px; border-bottom: 2px solid #e8e8e8; }
.tools-search-container { position: relative; max-width: 400px; flex: 1; margin-left: 30px; }
.tools-search-input { width: 100%; padding: 12px 45px 12px 20px; border: 2px solid #e0e0e0; border-radius: 30px; font-size: 15px; transition: all 0.3s ease; background: #f8f9fa; }
.tools-search-input:focus { outline: none; border-color: #4a90e2; background: #fff; box-shadow: 0 0 0 4px rgba(74,144,226,.1); }
.tools-search-icon { position: absolute; right: 20px; top: 50%; transform: translateY(-50%); color: #999; pointer-events: none; }
.tools-grid { display: grid; grid-template-columns: repeat(auto-fill, minmax(320px, 1fr)); gap: 25px; margin-top: 30px; }
.tool-item-card { background: #fff; border-radius: 16px; overflow: hidden; box-shadow: 0 4px 15px rgba(0,0,0,.08); transition: all .4s cubic-bezier(.175,.885,.32,1.275); position: relative; display: flex; flex-direction: column; height: 100%; }
.tool-item-card:hover { transform: translateY(-8px); box-shadow: 0 12px 35px rgba(0,0,0,.15); }
.tool-item-header { background: linear-gradient(135deg, #667eea 0%, #764ba2 100%); padding: 25px; position: relative; overflow: hidden; }
.tool-item-card .tool-item-header::before { content: ''; position: absolute; top: -50%; right: -50%; width: 200%; height: 200%; background: radial-gradient(circle, rgba(255,255,255,.1) 0%, transparent 70%); animation: tool-shimmer 3s infinite; }
@keyframes tool-shimmer { 0% { transform: rotate(0deg);} 100% { transform: rotate(360deg);} }
.tool-item-icon { font-size: 2.5rem; color: #fff; margin-bottom: 15px; display: inline-block; }
.tool-item-title { color: #fff; font-size: 1.3rem; font-weight: 600; margin: 0; text-shadow: 0 2px 4px rgba(0,0,0,.1); }
.tool-item-body { padding: 25px; flex: 1; display: flex; flex-direction: column; }
.tool-item-description { color: #666; line-height: 1.6; margin-bottom: 20px; flex: 1; }
.tool-item-meta { display: flex; flex-wrap: wrap; gap: 10px; margin-bottom: 20px; padding-top: 15px; border-top: 1px solid #f0f0f0; }
.tool-meta-tag { display: inline-flex; align-items: center; gap: 5px; padding: 5px 12px; background: #f0f4f8; border-radius: 20px; font-size: .85rem; color: #555; }
.tool-meta-tag i { font-size: .9rem; color: #888; }
.tool-meta-tag.meta-points { background: #fff4e6; color: #ff9800; }
.tool-meta-tag.meta-permission { background: #e8f5e9; color: #4caf50; }
.tool-item-action { margin-top: auto; }
.tool-action-btn { width: 100%; padding: 14px 24px; background: linear-gradient(135deg, #667eea 0%, #764ba2 100%); color: #fff; border: none; border-radius: 10px; font-size: 1rem; font-weight: 600; cursor: pointer; transition: all .3s ease; display: flex; align-items: center; justify-content: center; gap: 8px; text-decoration: none; }
.tool-action-btn:hover { transform: translateY(-2px); box-shadow: 0 8px 20px rgba(102,126,234,.4); }
.tool-action-btn:active { transform: translateY(0); }
.tool-action-btn.disabled { background: #ccc; cursor: not-allowed; }
.tools-empty-state { text-align: center; padding: 60px 20px; color: #999; }
.tools-empty-icon { font-size: 4rem; color: #ddd; margin-bottom: 20px; }
.tools-empty-text { font-size: 1.2rem; color: #666; }
.tools-loading { display: flex; justify-content: center; align-items: center; min-height: 400px; }
.tools-spinner { width: 50px; height: 50px; border: 4px solid #f3f3f3; border-top: 4px solid #667eea; border-radius: 50%; animation: spin 1s linear infinite; }
@keyframes spin { 0% { transform: rotate(0deg);} 100% { transform: rotate(360deg);} }

/* ============== Iframe 容器样式（由旧版实现迁移） ============== */
.tool-iframe-container { position: fixed; inset: 0; background: #f7f7fb; display: flex; flex-direction: column; z-index: 30; }
.tool-iframe-header { display: flex; justify-content: space-between; align-items: center; padding: 12px 16px; border-bottom: 1px solid #e5e7eb; background: #fff; }
.tool-iframe-info { display: flex; align-items: center; gap: 10px; }
.tool-iframe-icon { font-size: 1.2rem; color: #4f46e5; }
.tool-iframe-title { margin: 0; font-size: 1.1rem; font-weight: 600; }
.tool-iframe-actions { display: flex; gap: 8px; }
.tool-iframe-back-btn, .tool-iframe-refresh-btn { padding: 8px 12px; border: 1px solid #e5e7eb; border-radius: 8px; background: #fff; cursor: pointer; }
.tool-iframe-wrapper { position: relative; flex: 1; }
.tool-iframe-frame { position: absolute; inset: 0; width: 100%; height: 100%; border: 0; }
.tool-iframe-loading { position: absolute; inset: 0; display: flex; flex-direction: column; align-items: center; justify-content: center; background: rgba(255,255,255,.75); }
.tool-iframe-spinner { width: 40px; height: 40px; border: 4px solid #e5e7eb; border-top-color: #4f46e5; border-radius: 50%; animation: spin 1s linear infinite; }
</style>