<!-- src/views/DownloadDetail.vue -->
<template>
  <div class="section download-detail-page">
    <div class="detail-header">
      <button type="button" class="back-button" @click="goBack">
        <i class="fas fa-arrow-left me-2"></i>
        返回下载中心
      </button>

      <h2 class="detail-title">
        <i class="fas fa-download me-2"></i>
        {{ download?.title || '下载详情' }}
      </h2>

      <p v-if="lastUpdateDisplay" class="detail-meta">
        最后更新：
        <span>{{ lastUpdateDisplay }}</span>
      </p>
    </div>

    <!-- 加载中 -->
    <div v-if="loading" class="detail-state detail-loading">
      <div class="spinner-border text-primary" role="status">
        <span class="visually-hidden">Loading...</span>
      </div>
      <p class="mt-2 mb-0">正在加载下载详情...</p>
    </div>

    <!-- 错误 -->
    <div v-else-if="errorMsg" class="detail-state detail-error">
      <p class="mb-3">{{ errorMsg }}</p>
      <button type="button" class="btn btn-outline-primary" @click="reload">
        重新加载
      </button>
    </div>

    <!-- 无数据 -->
    <div v-else-if="!download" class="detail-state detail-empty">
      <p>未找到对应的下载项目。</p>
    </div>

    <!-- 正常内容 -->
    <div v-else>
      <!-- 简要信息 -->
      <div class="detail-summary">
        <div class="summary-item">
          <span class="label">版本</span>
          <span class="value">{{ download.version || '-' }}</span>
        </div>
        <div class="summary-item">
          <span class="label">文件数</span>
          <span class="value">{{ download.file_count || '-' }}</span>
        </div>
        <div class="summary-item">
          <span class="label">需要积分</span>
          <span class="value">
            <span v-if="download.required_points && download.required_points > 0">
              {{ download.required_points }}
            </span>
            <span v-else>无</span>
          </span>
        </div>
      </div>

      <!-- 下载链接表格 -->
      <div class="detail-table-wrapper" ref="tableWrapper">
        <table class="detail-table">
          <thead>
          <tr>
            <th>下载方式</th>
            <th>文件数</th>
            <th>提取码/访问密码</th>
            <th>资源有效期</th>
          </tr>
          </thead>
          <tbody>
          <tr v-if="parsedLinks.length === 0">
            <td colspan="4" class="text-center">暂无下载链接</td>
          </tr>
          <tr v-for="(link, index) in parsedLinks" :key="index">
            <td data-label="下载方式">
              <!-- 直链下载：通过 token + Blob 下载 -->
              <button
                  v-if="link.method === 'direct'"
                  type="button"
                  class="direct-download-link"
                  :disabled="directDownloadingFileId === link.file_id"
                  @click="handleDirectDownload(link)"
              >
                <i
                    class="fas me-2"
                    :class="
                      directDownloadingFileId === link.file_id
                        ? 'fa-spinner fa-spin'
                        : 'fa-download'
                    "
                ></i>
                {{ getMethodName(link, index) }}
              </button>

              <!-- 其它方式：直接新窗口打开链接 -->
              <a
                  v-else
                  class="external-link"
                  :href="link.url"
                  target="_blank"
                  rel="noopener noreferrer"
              >
                <i class="fas fa-external-link-alt me-2"></i>
                {{ getMethodName(link, index) }}
              </a>
            </td>

            <td data-label="文件数">
              {{ download.file_count || '-' }}
            </td>

            <td data-label="提取码/访问密码">
              <span v-if="link.method === 'direct'">无需密码</span>
              <span v-else>{{ link.password || '无' }}</span>
            </td>

            <td data-label="资源有效期">
              {{ link.expire_at || '无期限' }}
            </td>
          </tr>
          </tbody>
        </table>
      </div>
    </div>
  </div>
</template>

<script setup>
import {computed, onMounted, ref, watch} from 'vue';
import {useRoute, useRouter} from 'vue-router';
import {fetchDownloadDetail, createDownloadFileToken} from '@/api/download';
import {showErrorMessage} from '@/utils/messageBox';
import {useAuthStore} from '@/stores/auth';

const route = useRoute();
const router = useRouter();
const authStore = useAuthStore();

const loading = ref(true);
const errorMsg = ref('');
const download = ref(null);

const directDownloadingFileId = ref(null);
const tableWrapper = ref(null);

const downloadId = computed(() => route.params.id);

// 最后更新时间显示
const lastUpdateDisplay = computed(() => {
  if (!download.value?.last_update) return '';
  const d = new Date(download.value.last_update);
  if (Number.isNaN(d.getTime())) return download.value.last_update;
  return d.toLocaleDateString('zh-CN');
});

// 解析 download_links（字符串 JSON 或数组）
const parsedLinks = computed(() => {
  if (!download.value?.download_links) return [];
  let links = download.value.download_links;

  try {
    if (typeof links === 'string') {
      links = JSON.parse(links);
    }
  } catch (e) {
    console.error('解析 download_links 失败:', e);
    return [];
  }

  if (!Array.isArray(links)) return [];
  return links;
});

const METHOD_NAMES = {
  baidu: '百度网盘',
  '123pan': '123网盘',
  onedrive: 'One Drive',
  direct: '直链下载',
  other: '其他下载',
};

function getMethodName(link, index) {
  return METHOD_NAMES[link.method] || link.name || `下载链接${index + 1}`;
}

async function loadDetail() {
  loading.value = true;
  errorMsg.value = '';
  download.value = null;

  try {
    const data = await fetchDownloadDetail(downloadId.value);
    download.value = data || null;
  } catch (e) {
    console.error('加载下载详情失败:', e);
    errorMsg.value = e?.message || '加载下载详情失败，请稍后重试。';
  } finally {
    loading.value = false;
  }
}

function reload() {
  loadDetail();
}

function goBack() {
  router.push({name: 'Download'});
}

// 直链下载（参考原版：Token 清理 + Blob 下载）
async function handleDirectDownload(link) {
  const fileId = link.file_id;
  if (!fileId) {
    showErrorMessage('无效的文件ID');
    return;
  }

  if (!authStore.token) {
    showErrorMessage('请先登录');
    if (
        typeof window !== 'undefined' &&
        typeof window.showLoginRequired === 'function'
    ) {
      setTimeout(() => window.showLoginRequired('download'), 1500);
    }
    return;
  }

  // 避免重复点击
  if (directDownloadingFileId.value === fileId) {
    return;
  }

  directDownloadingFileId.value = fileId;

  try {
    // 1. 请求下载 token
    const tokenData = await createDownloadFileToken(fileId);

    if (!tokenData || !tokenData.success || !tokenData.downloadUrl) {
      throw new Error(tokenData?.error || '下载令牌无效');
    }

    let cleanDownloadUrl = tokenData.downloadUrl;

    // 尝试清理 token 中可能出现的前缀 / 空格 / 冒号
    try {
      const url = new URL(cleanDownloadUrl);
      let downloadToken = url.searchParams.get('token');

      if (downloadToken) {
        downloadToken = downloadToken.trim();

        if (downloadToken.startsWith('Bearer ')) {
          downloadToken = downloadToken.slice(7).trim();
        }

        if (downloadToken.includes(' ')) {
          downloadToken = downloadToken.split(' ')[0].trim();
        }
        if (downloadToken.includes(':')) {
          downloadToken = downloadToken.split(':')[0].trim();
        }

        url.searchParams.set('token', downloadToken);
        cleanDownloadUrl = url.toString();
      }
    } catch (e) {
      console.warn('URL 解析 / 清理 token 失败，使用原始 URL：', e);
    }

    // 2. 真正下载文件（Blob）
    const resp = await fetch(cleanDownloadUrl);

    if (!resp.ok) {
      let msg = '文件下载失败';
      try {
        const errData = await resp.json();
        msg = errData.error || msg;
      } catch {
        // ignore
      }
      throw new Error(msg);
    }

    // 从响应头里猜文件名
    const contentDisposition = resp.headers.get('Content-Disposition');
    let filename = 'download';

    if (contentDisposition) {
      const utf8Match = contentDisposition.match(
          /filename\*=UTF-8''([^;,\s]+)/i,
      );
      if (utf8Match && utf8Match[1]) {
        try {
          filename = decodeURIComponent(utf8Match[1]);
        } catch (e) {
          console.warn('解码 UTF-8 文件名失败:', e);
        }
      }

      if (!filename || filename === 'download') {
        const nameMatch = contentDisposition.match(/filename="?([^"]+)"?/i);
        if (nameMatch && nameMatch[1]) {
          filename = nameMatch[1];
        }
      }

      if (filename) {
        filename = filename.replace(/[<>:"|?*]/g, '_').trim();
      }
    }

    if (!filename || filename === 'download') {
      try {
        const url = new URL(cleanDownloadUrl);
        const parts = url.pathname.split('/');
        const last = parts[parts.length - 1];
        if (last && last !== 'download') {
          filename = decodeURIComponent(last);
        }
      } catch (e) {
        console.warn('从 URL 解析文件名失败:', e);
      }
    }

    if (!filename) {
      filename = 'download';
    }

    const blob = await resp.blob();
    const blobUrl = window.URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = blobUrl;
    a.download = filename;
    a.style.display = 'none';
    document.body.appendChild(a);
    a.click();

    setTimeout(() => {
      document.body.removeChild(a);
      window.URL.revokeObjectURL(blobUrl);
    }, 200);
  } catch (e) {
    console.error('直链下载失败:', e);
    showErrorMessage('文件下载失败: ' + (e?.message || '未知错误'));
  } finally {
    directDownloadingFileId.value = null;
  }
}

onMounted(() => {
  loadDetail();
});

// 路由参数变化时，重新加载
watch(
    () => downloadId.value,
    () => {
      if (downloadId.value) {
        loadDetail();
      }
    },
);
</script>

<style scoped>
.download-detail-page {
  background: #ffffff;
  border-radius: 16px;
  padding: 1.5rem 1.5rem 2rem;
  box-shadow: 0 4px 20px rgba(0, 0, 0, 0.06);
}

/* 头部 */
.detail-header {
  display: flex;
  flex-direction: column;
  gap: 0.5rem;
  margin-bottom: 1.5rem;
}

.back-button {
  align-self: flex-start;
  border: none;
  background: transparent;
  color: #495057;
  font-size: 0.9rem;
  display: inline-flex;
  align-items: center;
  padding: 0.25rem 0.75rem;
  border-radius: 999px;
  background-color: #f1f3f5;
  transition: background-color 0.15s ease,
  transform 0.1s ease;
  cursor: pointer;
}

.back-button:hover {
  background-color: #e9ecef;
  transform: translateX(-1px);
}

.detail-title {
  font-size: 1.25rem;
  font-weight: 600;
  color: #212529;
  margin: 0;
}

.detail-meta {
  margin: 0;
  font-size: 0.9rem;
  color: #868e96;
}

.detail-meta span {
  color: #495057;
}

/* 顶部简要信息 */
.detail-summary {
  display: flex;
  flex-wrap: wrap;
  gap: 1rem;
  margin-bottom: 1rem;
}

.summary-item {
  padding: 0.6rem 0.9rem;
  border-radius: 999px;
  background: #f8f9fa;
  font-size: 0.85rem;
  display: inline-flex;
  align-items: baseline;
  gap: 0.35rem;
}

.summary-item .label {
  color: #868e96;
}

.summary-item .value {
  color: #495057;
  font-weight: 600;
}

/* 状态块 */
.detail-state {
  text-align: center;
  padding: 2rem 0;
  color: #495057;
}

.detail-error {
  color: #c92a2a;
}

.detail-empty {
  color: #868e96;
}

/* 表格容器 */
.detail-table-wrapper {
  overflow-x: auto;
  -webkit-overflow-scrolling: touch;
  margin: 20px 0;
}

/* 表格 */
.detail-table {
  width: 100%;
  border-collapse: collapse;
  background: white;
  white-space: nowrap;
}

.detail-table thead {
  background: linear-gradient(135deg, #f8f9fa 0%, #e9ecef 100%);
}

.detail-table th {
  padding: 16px 20px;
  text-align: left;
  font-weight: 700;
  color: #2c3e50;
  text-transform: uppercase;
  font-size: 0.85rem;
  letter-spacing: 0.5px;
  border-bottom: 2px solid #667eea;
  white-space: nowrap;
}

.detail-table td {
  padding: 16px 20px;
  vertical-align: middle;
  border-bottom: 1px solid #f1f3f4;
  white-space: nowrap;
  overflow: hidden;
  text-overflow: ellipsis;
}

.detail-table tr:hover {
  background: linear-gradient(135deg, #f8f9ff 0%, #fff5f8 100%);
}

.detail-table tr:last-child td {
  border-bottom: none;
}

/* 外部链接 */
.external-link {
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

.external-link:hover {
  color: #764ba2;
  background: linear-gradient(
      135deg,
      rgba(102, 126, 234, 0.1) 0%,
      rgba(118, 75, 162, 0.1) 100%
  );
  transform: translateX(3px);
  box-shadow: 0 2px 8px rgba(102, 126, 234, 0.2);
}

.external-link i {
  font-size: 0.9em;
}

/* 直链下载按钮 */
.direct-download-link {
  border: none;
  outline: none;
  cursor: pointer;
  background: linear-gradient(135deg, #4c6fff, #667eea);
  color: #ffffff;
  font-weight: 600;
  display: inline-flex;
  align-items: center;
  gap: 8px;
  padding: 6px 14px;
  border-radius: 999px;
  font-size: 0.9rem;
  box-shadow: 0 2px 8px rgba(76, 111, 255, 0.35);
  transition: box-shadow 0.15s ease,
  transform 0.1s ease,
  opacity 0.15s ease;
}

.direct-download-link:hover {
  transform: translateY(-1px);
  box-shadow: 0 4px 12px rgba(76, 111, 255, 0.4);
}

.direct-download-link:disabled {
  opacity: 0.65;
  cursor: default;
  box-shadow: none;
}

/* PC */
@media (min-width: 769px) {
  .detail-table-wrapper {
    overflow-x: visible;
  }

  .detail-table {
    table-layout: auto;
  }

  .detail-table th,
  .detail-table td {
    white-space: nowrap;
    overflow: hidden;
    text-overflow: ellipsis;
  }
}

/* 移动端 */
@media (max-width: 768px) {
  .download-detail-page {
    padding: 1rem 1rem 1.5rem;
  }

  .detail-summary {
    flex-direction: column;
  }

  .detail-table-wrapper {
    margin: 15px -15px;
    padding: 0 15px;
    overflow-x: auto;
    -webkit-overflow-scrolling: touch;
  }

  .detail-table {
    min-width: 100%;
    font-size: 0.85rem;
  }

  .detail-table th {
    padding: 12px 15px;
    font-size: 0.75rem;
    white-space: nowrap;
    position: sticky;
    top: 0;
    background: linear-gradient(135deg, #f8f9fa 0%, #e9ecef 100%);
    z-index: 10;
  }

  .detail-table td {
    padding: 12px 15px;
    white-space: nowrap;
    overflow: hidden;
    text-overflow: ellipsis;
    max-width: 200px;
  }

  .external-link {
    padding: 5px 10px;
    font-size: 0.85rem;
  }

  .detail-table-wrapper::after {
    content: '→ 左右滑动查看更多';
    display: block;
    text-align: center;
    font-size: 0.75rem;
    color: #999;
    margin-top: 10px;
    animation: fadeInOut 2s ease-in-out infinite;
  }

  @keyframes fadeInOut {
    0%,
    100% {
      opacity: 0.5;
    }
    50% {
      opacity: 1;
    }
  }
}
</style>
