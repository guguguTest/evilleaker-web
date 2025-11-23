<!-- src/views/Download.vue -->
<template>
  <div class="section">
    <h1 class="page-title" data-i18n="download.title">下载中心</h1>

    <!-- 加载中 -->
    <div v-if="loading" class="download-loading">
      <div class="spinner-border text-primary" role="status">
        <span class="visually-hidden">Loading...</span>
      </div>
      <p>下载列表加载中，请稍候...</p>
    </div>

    <!-- 权限不足 / 需要登录 -->
    <div v-else-if="!hasAccess" class="login-required-container">
      <div class="login-required-card">
        <div class="login-required-icon">
          <i class="fas fa-ban"></i>
        </div>
        <h2>需要权限</h2>
        <p>当前账号没有访问下载中心的权限，请检查登录状态或联系管理员。</p>
        <button type="button" class="login-btn" @click="goHome">
          <i class="fas fa-home me-2"></i>
          返回首页
        </button>
      </div>
    </div>

    <!-- 加载失败 -->
    <div v-else-if="errorMsg" class="download-error">
      <p class="mb-3">{{ errorMsg }}</p>
      <button type="button" class="btn btn-outline-primary btn-sm" @click="reload">
        重新加载
      </button>
    </div>

    <!-- 正常内容 -->
    <div v-else>
      <!-- 游戏下载 -->
      <div class="section download-section">
        <div class="download-section-header">
          <h2 class="section-title">
            <i class="fas fa-gamepad me-2"></i>
            <span>游戏下载</span>
          </h2>
          <div v-if="gameLastUpdate" class="download-last-update">
            最后更新：<span>{{ gameLastUpdate }}</span>
          </div>
        </div>

        <div v-if="gameDownloads.length" class="download-table-wrapper">
          <table class="download-table">
            <thead>
            <tr>
              <th>游戏名称</th>
              <th>版本</th>
              <th>文件数</th>
              <th>访问权限</th>
              <th>特殊访问权限</th>
              <th>所需积分</th>
            </tr>
            </thead>
            <tbody>
            <tr
                v-for="item in gameDownloads"
                :key="item.id"
                class="download-row"
                @click="handleRowClick(item)"
            >
              <td data-label="游戏名称">
                  <span
                      v-if="hasDownloadAccess(item)"
                      class="download-link"
                      @click.stop="handleRowClick(item)"
                  >
                    <i class="fas fa-link me-2"></i>
                    {{ item.title }}
                  </span>
                <span v-else class="text-muted">
                    <i class="fas fa-lock me-1 text-warning"></i>
                    {{ item.title }}（权限不足）
                  </span>
              </td>
              <td data-label="版本">{{ item.version || '-' }}</td>
              <td data-label="文件数">{{ item.file_count || '-' }}</td>
              <td data-label="访问权限">
                  <span class="access-badge">
                    {{ formatAccessLevel(item) }}
                  </span>
              </td>
              <td data-label="特殊访问权限">
                  <span class="special-badge" v-if="item.special_group">
                    {{ formatSpecialGroup(item) }}
                  </span>
                <span class="text-muted" v-else>无</span>
              </td>
              <td data-label="所需积分">
                  <span
                      v-if="item.required_points && item.required_points > 0"
                      class="points-badge"
                  >
                    <i class="fas fa-coins me-1"></i>
                    {{ formatPoints(item) }}
                  </span>
                <span v-else class="text-muted">免费</span>
              </td>
            </tr>
            </tbody>
          </table>
        </div>
        <div v-else class="download-empty">
          暂无可用的游戏下载。
        </div>
      </div>

      <!-- 存档下载 -->
      <div class="section download-section">
        <div class="download-section-header">
          <h2 class="section-title">
            <i class="fas fa-save me-2"></i>
            <span>存档下载</span>
          </h2>
          <div v-if="archiveLastUpdate" class="download-last-update">
            最后更新：<span>{{ archiveLastUpdate }}</span>
          </div>
        </div>

        <div v-if="archiveDownloads.length" class="download-table-wrapper">
          <table class="download-table">
            <thead>
            <tr>
              <th>存档名称</th>
              <th>版本</th>
              <th>文件数</th>
              <th>访问权限</th>
              <th>特殊访问权限</th>
              <th>所需积分</th>
            </tr>
            </thead>
            <tbody>
            <tr
                v-for="item in archiveDownloads"
                :key="item.id"
                class="download-row"
                @click="handleRowClick(item)"
            >
              <td data-label="存档名称">
                  <span
                      v-if="hasDownloadAccess(item)"
                      class="download-link"
                      @click.stop="handleRowClick(item)"
                  >
                    <i class="fas fa-link me-2"></i>
                    {{ item.title }}
                  </span>
                <span v-else class="text-muted">
                    <i class="fas fa-lock me-1 text-warning"></i>
                    {{ item.title }}（权限不足）
                  </span>
              </td>
              <td data-label="版本">{{ item.version || '-' }}</td>
              <td data-label="文件数">{{ item.file_count || '-' }}</td>
              <td data-label="访问权限">
                  <span class="access-badge">
                    {{ formatAccessLevel(item) }}
                  </span>
              </td>
              <td data-label="特殊访问权限">
                  <span class="special-badge" v-if="item.special_group">
                    {{ formatSpecialGroup(item) }}
                  </span>
                <span class="text-muted" v-else>无</span>
              </td>
              <td data-label="所需积分">
                  <span
                      v-if="item.required_points && item.required_points > 0"
                      class="points-badge"
                  >
                    <i class="fas fa-coins me-1"></i>
                    {{ formatPoints(item) }}
                  </span>
                <span v-else class="text-muted">免费</span>
              </td>
            </tr>
            </tbody>
          </table>
        </div>
        <div v-else class="download-empty">
          暂无可用的存档下载。
        </div>
      </div>

      <!-- 其他资源 -->
      <div class="section download-section">
        <div class="download-section-header">
          <h2 class="section-title">
            <i class="fas fa-folder-open me-2"></i>
            <span>其他资源</span>
          </h2>
          <div v-if="otherLastUpdate" class="download-last-update">
            最后更新：<span>{{ otherLastUpdate }}</span>
          </div>
        </div>

        <div v-if="otherDownloads.length" class="download-table-wrapper">
          <table class="download-table">
            <thead>
            <tr>
              <th>资源名称</th>
              <th>版本</th>
              <th>文件数</th>
              <th>访问权限</th>
              <th>特殊访问权限</th>
              <th>所需积分</th>
            </tr>
            </thead>
            <tbody>
            <tr
                v-for="item in otherDownloads"
                :key="item.id"
                class="download-row"
                @click="handleRowClick(item)"
            >
              <td data-label="资源名称">
                  <span
                      v-if="hasDownloadAccess(item)"
                      class="download-link"
                      @click.stop="handleRowClick(item)"
                  >
                    <i class="fas fa-link me-2"></i>
                    {{ item.title }}
                  </span>
                <span v-else class="text-muted">
                    <i class="fas fa-lock me-1 text-warning"></i>
                    {{ item.title }}（权限不足）
                  </span>
              </td>
              <td data-label="版本">{{ item.version || '-' }}</td>
              <td data-label="文件数">{{ item.file_count || '-' }}</td>
              <td data-label="访问权限">
                  <span class="access-badge">
                    {{ formatAccessLevel(item) }}
                  </span>
              </td>
              <td data-label="特殊访问权限">
                  <span class="special-badge" v-if="item.special_group">
                    {{ formatSpecialGroup(item) }}
                  </span>
                <span class="text-muted" v-else>无</span>
              </td>
              <td data-label="所需积分">
                  <span
                      v-if="item.required_points && item.required_points > 0"
                      class="points-badge"
                  >
                    <i class="fas fa-coins me-1"></i>
                    {{ formatPoints(item) }}
                  </span>
                <span v-else class="text-muted">免费</span>
              </td>
            </tr>
            </tbody>
          </table>
        </div>
        <div v-else class="download-empty">
          暂无可用的其他资源。
        </div>
      </div>

      <!-- 说明 -->
      <div class="section download-section download-note-section">
        <h2 class="section-title">
          <i class="fas fa-info-circle me-2"></i>
          <span>下载说明</span>
        </h2>
        <ul class="download-notes">
          <li>部分资源可能需要登录后才能下载，请先登录账号。</li>
          <li>部分资源需要达到指定用户组或特殊用户组才可访问。</li>
          <li>带有积分消耗的资源，下载前请确认自己的积分是否足够。</li>
          <li>如遇下载失败或速度过慢，可以稍后重试或更换浏览器。</li>
        </ul>
      </div>
    </div>
  </div>
</template>

<script setup>
import {ref, computed, onMounted} from 'vue';
import {useRouter} from 'vue-router';
import {useAuthStore} from '@/stores/auth';
import {
  checkDownloadPermission,
  fetchDownloads,
  accessDownload,
} from '@/api/download';
import {
  showErrorMessage,
  showInfoMessage,
  showSuccessMessage,
} from '@/utils/messageBox.js';

const router = useRouter();
const authStore = useAuthStore();

const loading = ref(true);
const hasAccess = ref(true);
const errorMsg = ref('');

const downloads = ref([]);

// 从登录信息里取用户等级和特殊组
const userRank = computed(() => authStore.user?.user_rank ?? 0);
const userSpecialGroup = computed(() => authStore.user?.rankSp ?? 0);

// 特殊组映射（和原版一致）
const SPECIAL_GROUP_MAP = {
  maimoller: 1,
  coadmin: 2,
};

const accessLevelNames = {
  '-1': '不限',
  '0': '普通用户',
  '1': '初级用户',
  '2': '中级用户',
  '3': '高级用户',
  '4': '贵宾用户',
  '5': '系统管理员',
};

const specialGroupNames = {
  maimoller: 'maimoller',
  coadmin: '协同管理员',
};

// 与后端一致的排序：sort_order 升序，created_at 降序
function compareBySortOrderAndDate(a, b) {
  const sa = Number((a && a.sort_order) || 0);
  const sb = Number((b && b.sort_order) || 0);
  if (sa !== sb) return sa - sb;
  const ta = a && a.created_at ? new Date(a.created_at).getTime() : 0;
  const tb = b && b.created_at ? new Date(b.created_at).getTime() : 0;
  return (isFinite(tb) ? tb : 0) - (isFinite(ta) ? ta : 0);
}

// 分类后的三个列表
const gameDownloads = computed(() =>
    downloads.value
        .filter((d) => d.category === 'game')
        .slice()
        .sort(compareBySortOrderAndDate),
);

const archiveDownloads = computed(() =>
    downloads.value
        .filter((d) => d.category === 'archive')
        .slice()
        .sort(compareBySortOrderAndDate),
);

const otherDownloads = computed(() =>
    downloads.value
        .filter((d) => d.category === 'other')
        .slice()
        .sort(compareBySortOrderAndDate),
);

// 计算分类的“最后更新”时间（优先 last_update / updated_at / created_at）
function getLastUpdate(list) {
  if (!Array.isArray(list) || !list.length) return '';
  const latest = list.reduce((latestDate, item) => {
    const dateStr = item.last_update || item.updated_at || item.created_at;
    const d = dateStr ? new Date(dateStr) : new Date(0);
    return d > latestDate ? d : latestDate;
  }, new Date(0));

  return latest > new Date(0) ? latest.toLocaleDateString('zh-CN') : '';
}

const gameLastUpdate = computed(() => getLastUpdate(gameDownloads.value));
const archiveLastUpdate = computed(() => getLastUpdate(archiveDownloads.value));
const otherLastUpdate = computed(() => getLastUpdate(otherDownloads.value));

// 检查单个下载项权限
function hasDownloadAccess(download) {
  let ok = true;
  const rank = userRank.value || 0;
  const sg = userSpecialGroup.value || 0;

  if (
      download.access_level !== undefined &&
      download.access_level !== null &&
      download.access_level >= 0
  ) {
    ok = rank >= download.access_level;
  }

  if (download.special_group && download.special_group !== '') {
    const required = SPECIAL_GROUP_MAP[download.special_group] || 0;
    ok = ok && sg === required; // 和原版保持同样的“等于”逻辑
  }

  return ok;
}

function formatAccessLevel(download) {
  const key = String(download.access_level ?? 0);
  return accessLevelNames[key] || accessLevelNames['0'];
}

function formatSpecialGroup(download) {
  if (!download.special_group) return '无';
  return specialGroupNames[download.special_group] || download.special_group;
}

function formatPoints(download) {
  if (download.required_points && download.required_points > 0) {
    return String(download.required_points);
  }
  return '无';
}

// 行点击：权限 + 积分校验 + 跳详情页
async function handleRowClick(download) {
  if (!hasDownloadAccess(download)) {
    showErrorMessage('您的用户组级别无法访问该资源');
    return;
  }

  const id = download.id;

  // 需要积分时，先确认 + 调用 /api/downloads/:id/access
  if (download.required_points && download.required_points > 0) {
    const ok = window.confirm(
        `访问此资源需要 ${download.required_points} 积分，确定要继续吗？`,
    );
    if (!ok) return;

    try {
      const result = await accessDownload(id);

      if (result && result.success) {
        showSuccessMessage(`已扣除 ${download.required_points} 积分`);
        setTimeout(() => {
          router.push({name: 'DownloadDetail', params: {id}});
        }, 800);
      } else {
        showErrorMessage(result?.error || '访问资源失败');
      }
    } catch (error) {
      console.error('访问资源错误:', error);
      showErrorMessage('访问资源失败: ' + (error?.message || '未知错误'));
    }

    return;
  }

  // 不需要积分，直接跳转详情页
  router.push({name: 'DownloadDetail', params: {id}});
}

// 返回首页按钮
function goHome() {
  router.push('/home');
}

function reload() {
  loading.value = true;
  errorMsg.value = '';
  init();
}

async function init() {
  try {
    // 访问权限检查
    try {
      const perm = await checkDownloadPermission();
      if (perm && perm.hasAccess === false) {
        hasAccess.value = false;
        loading.value = false;
        return;
      }
    } catch (e) {
      console.warn('[download] 权限检查失败，默认允许访问', e);
    }

    const list = await fetchDownloads();
    downloads.value = Array.isArray(list) ? list : [];
    if (!downloads.value.length) {
      showInfoMessage('当前暂无可用的下载资源。');
    }
  } catch (e) {
    console.error('[download] 加载下载列表失败', e);
    errorMsg.value = '下载列表加载失败，请稍后重试。';
  } finally {
    loading.value = false;
  }
}

onMounted(() => {
  init();
});
</script>

<style scoped>
/* 下载页整体容器 */
.section.download-section {
  margin-bottom: 3rem;
  background: #ffffff;
  border-radius: 16px;
  padding: 2rem;
  box-shadow: 0 4px 20px rgba(0, 0, 0, 0.06);
  position: relative;
  overflow: hidden;
  border: 1px solid #e9ecef;
}

.section.download-section::before {
  content: '';
  position: absolute;
  inset: 0;
  background: radial-gradient(circle at top left, rgba(86, 197, 255, 0.12), transparent 55%),
  radial-gradient(circle at bottom right, rgba(111, 66, 193, 0.07), transparent 60%);
  opacity: 0.6;
  pointer-events: none;
}

.section.download-section > * {
  position: relative;
  z-index: 1;
}

/* 标题与头部 */
.download-section-header {
  display: flex;
  align-items: center;
  justify-content: space-between;
  gap: 0.75rem;
  margin-bottom: 1.25rem;
}

.section-title {
  font-size: 1.05rem;
  font-weight: 600;
  color: #212529;
  display: flex;
  align-items: center;
  gap: 0.4rem;
  margin: 0;
}

.section-title i {
  color: #4c6fff;
}

.download-last-update {
  font-size: 0.85rem;
  color: #868e96;
}

.download-last-update span {
  color: #495057;
}

/* 加载状态 */
.download-loading {
  padding: 3rem 0;
  text-align: center;
  color: #495057;
}

/* 错误状态 */
.download-error {
  padding: 2rem;
  margin-top: 1rem;
  border-radius: 12px;
  border: 1px dashed #ffc9c9;
  background: #fff5f5;
  color: #c92a2a;
}

/* 登录 / 权限不足 */
.login-required-container {
  display: flex;
  justify-content: center;
  align-items: center;
  padding: 3rem 0;
}

.login-required-card {
  text-align: center;
  max-width: 420px;
  padding: 2rem 2.5rem;
  border-radius: 24px;
  background: radial-gradient(circle at top, #ffffff 0%, #f8f9fa 100%);
  box-shadow: 0 12px 40px rgba(15, 23, 42, 0.15);
  border: 1px solid rgba(222, 226, 230, 0.8);
}

.login-required-card h2 {
  margin-top: 1rem;
  font-weight: 700;
  color: #212529;
  font-size: 1.15rem;
}

.login-required-card p {
  margin-bottom: 0;
  margin-top: 0.5rem;
  color: #868e96;
  font-size: 0.9rem;
}

.login-required-icon {
  width: 72px;
  height: 72px;
  margin: 0 auto 1rem;
  border-radius: 50%;
  background: #fff5f5;
  display: flex;
  align-items: center;
  justify-content: center;
  color: #fa5252;
  font-size: 2rem;
}

.login-btn {
  margin-top: 1.5rem;
  border: none;
  border-radius: 999px;
  padding: 0.5rem 1.5rem;
  font-size: 0.9rem;
  background: linear-gradient(135deg, #4c6fff, #667eea);
  color: #ffffff;
  font-weight: 600;
  display: inline-flex;
  align-items: center;
  gap: 0.4rem;
  box-shadow: 0 6px 18px rgba(76, 111, 255, 0.45);
  cursor: pointer;
}

.login-btn:hover {
  box-shadow: 0 10px 24px rgba(76, 111, 255, 0.6);
  transform: translateY(-1px);
}

/* 表格 */
.download-table-wrapper {
  width: 100%;
  overflow-x: auto;
  -webkit-overflow-scrolling: touch;
}

.download-table {
  width: 100%;
  border-collapse: collapse;
  background: #ffffff;
}

/* 表头背景浅灰 + 深色文字 */
.download-table thead {
  background: linear-gradient(90deg, #f8f9fa, #e9ecef);
}

.download-table th,
.download-table td {
  padding: 0.9rem 0.75rem;
  border-bottom: 1px solid #e9ecef;
  text-align: left;
  vertical-align: middle;
}

.download-table th {
  font-weight: 600;
  text-transform: none;
  font-size: 0.85rem;
  letter-spacing: 0.3px;
  position: relative;
  color: #343a40; /* 深色标题文字 */
}

.download-table th::after {
  content: '';
  position: absolute;
  left: 0;
  bottom: 0;
  width: 32px;
  height: 2px;
  border-radius: 999px;
  background: linear-gradient(90deg, #4c6fff, #845ef7);
}

/* 行 hover 效果 */
.download-row {
  cursor: pointer;
  transition: background-color 0.15s ease,
  transform 0.1s ease,
  box-shadow 0.15s ease;
}

.download-row:hover {
  background-color: rgba(59, 130, 246, 0.04);
  transform: translateY(-1px);
}

/* 关键：下载入口链接样式
   —— 完全对齐 DownloadDetail.vue 里的 .external-link */
.download-link {
  color: #667eea;
  text-decoration: none;
  font-weight: 600;
  display: inline-flex;
  align-items: center;
  gap: 8px;
  padding: 6px 12px;
  border-radius: 6px;
  background: linear-gradient(
      135deg,
      transparent 0%,
      rgba(102, 126, 234, 0.05) 100%
  );
  transition: all 0.3s ease;
  white-space: nowrap;
}

.download-link:hover {
  color: #764ba2;
  background: linear-gradient(
      135deg,
      rgba(102, 126, 234, 0.1) 0%,
      rgba(118, 75, 162, 0.1) 100%
  );
  transform: translateX(3px);
  box-shadow: 0 2px 8px rgba(102, 126, 234, 0.2);
}

.download-link i {
  font-size: 0.9rem;
}

/* badge：访问权限 */
.access-badge {
  display: inline-flex;
  align-items: center;
  padding: 0.25rem 0.6rem;
  border-radius: 999px;
  font-size: 0.78rem;
  font-weight: 600;
  background: #e9ecef;
  color: #495057;
  border: 1px solid transparent;
}

/* 特殊访问权限 badge */
.special-badge {
  display: inline-flex;
  align-items: center;
  padding: 0.2rem 0.5rem;
  border-radius: 999px;
  font-size: 0.78rem;
  background: #fff3bf;
  color: #856404;
}

/* 积分 badge */
.points-badge {
  display: inline-flex;
  align-items: center;
  padding: 0.25rem 0.6rem;
  border-radius: 999px;
  font-size: 0.8rem;
  background: #fff4e6;
  color: #d9480f;
}

/* 空状态 */
.download-empty {
  padding: 1.2rem 0.5rem 0.3rem;
  font-size: 0.9rem;
  color: #868e96;
}

/* 说明区 */
.download-note-section {
  margin-bottom: 0;
}

.download-notes {
  margin: 0.5rem 0 0;
  padding-left: 1.25rem;
  color: #495057;
  font-size: 0.9rem;
}

.download-notes li + li {
  margin-top: 0.25rem;
}

/* 响应式 */
@media (max-width: 768px) {
  .section.download-section {
    padding: 1.25rem 1rem;
    margin-bottom: 1.5rem;
  }

  .download-section-header {
    flex-direction: column;
    align-items: flex-start;
  }

  .download-table-wrapper {
    margin: 0 -0.75rem;
    padding: 0 0.75rem;
  }

  .download-table th,
  .download-table td {
    white-space: nowrap;
  }

  .download-link {
    white-space: normal;
  }
}
</style>
