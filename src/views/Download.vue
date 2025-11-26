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
          <i class="fas fa-lock"></i>
        </div>
        <h3>需要登录后访问</h3>
        <p>该页面仅对登录用户开放，请先登录或联系管理员开通权限。</p>
        <div class="login-required-actions">
          <button type="button" class="btn btn-primary" @click="goLogin">去登录</button>
          <button type="button" class="btn btn-outline-secondary" @click="goHome">返回首页</button>
        </div>
      </div>
    </div>

    <!-- 加载失败 -->
    <div v-else-if="errorMsg" class="download-error">
      <p class="mb-3">{{ errorMsg }}</p>
      <button type="button" class="btn btn-outline-primary btn-sm" @click="reload">重新加载</button>
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
                :key="item.id || item._id"
                class="download-row"
                @click="handleRowClick(item)"
            >
              <td data-label="游戏名称">
                  <span v-if="hasDownloadAccess(item)" class="download-link" @click.stop="handleRowClick(item)">
                    <i class="fas fa-link me-2"></i>
                    {{ item.title }}
                  </span>
                <span v-else class="text-muted">
                    <i class="fas fa-lock me-1 text-warning"></i>
                    {{ item.title }}（权限不足）
                  </span>
              </td>
              <td data-label="版本">{{ item.version || '-' }}</td>
              <td data-label="文件数">{{ item.file_count ?? item.files_count ?? '-' }}</td>
              <td data-label="访问权限">
                <!-- ✅ 最小改动：绑定等级类名 -->
                <span class="access-badge" :class="rankClass(item)">{{ formatAccessLevel(item) }}</span>
              </td>
              <td data-label="特殊访问权限">
                <span v-if="item.special_group" class="special-badge" :class="specialClass(item)">{{ formatSpecialGroup(item) }}</span>
                <span v-else class="text-muted">无</span>
              </td>
              <td data-label="所需积分">
                <span class="points-badge">{{ formatPoints(item) }}</span>
              </td>
            </tr>
            </tbody>
          </table>
        </div>
        <div v-else class="download-empty">暂无可用的游戏下载。</div>
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
                :key="item.id || item._id"
                class="download-row"
                @click="handleRowClick(item)"
            >
              <td data-label="存档名称">
                  <span v-if="hasDownloadAccess(item)" class="download-link" @click.stop="handleRowClick(item)">
                    <i class="fas fa-link me-2"></i>
                    {{ item.title }}
                  </span>
                <span v-else class="text-muted">
                    <i class="fas fa-lock me-1 text-warning"></i>
                    {{ item.title }}（权限不足）
                  </span>
              </td>
              <td data-label="版本">{{ item.version || '-' }}</td>
              <td data-label="文件数">{{ item.file_count ?? item.files_count ?? '-' }}</td>
              <td data-label="访问权限">
                <!-- ✅ 最小改动：绑定等级类名 -->
                <span class="access-badge" :class="rankClass(item)">{{ formatAccessLevel(item) }}</span>
              </td>
              <td data-label="特殊访问权限">
                <span v-if="item.special_group" class="special-badge" :class="specialClass(item)">{{ formatSpecialGroup(item) }}</span>
                <span v-else class="text-muted">无</span>
              </td>
              <td data-label="所需积分">
                <span class="points-badge">{{ formatPoints(item) }}</span>
              </td>
            </tr>
            </tbody>
          </table>
        </div>
        <div v-else class="download-empty">暂无可用的存档下载。</div>
      </div>

      <!-- 其他资源 -->
      <div class="section download-section">
        <div class="download-section-header">
          <h2 class="section-title">
            <i class="fas fa-box-open me-2"></i>
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
                :key="item.id || item._id"
                class="download-row"
                @click="handleRowClick(item)"
            >
              <td data-label="资源名称">
                  <span v-if="hasDownloadAccess(item)" class="download-link" @click.stop="handleRowClick(item)">
                    <i class="fas fa-link me-2"></i>
                    {{ item.title }}
                  </span>
                <span v-else class="text-muted">
                    <i class="fas fa-lock me-1 text-warning"></i>
                    {{ item.title }}（权限不足）
                  </span>
              </td>
              <td data-label="版本">{{ item.version || '-' }}</td>
              <td data-label="文件数">{{ item.file_count ?? item.files_count ?? '-' }}</td>
              <td data-label="访问权限">
                <!-- ✅ 最小改动：绑定等级类名 -->
                <span class="access-badge" :class="rankClass(item)">{{ formatAccessLevel(item) }}</span>
              </td>
              <td data-label="特殊访问权限">
                <span v-if="item.special_group" class="special-badge" :class="specialClass(item)">{{ formatSpecialGroup(item) }}</span>
                <span v-else class="text-muted">无</span>
              </td>
              <td data-label="所需积分">
                <span class="points-badge">{{ formatPoints(item) }}</span>
              </td>
            </tr>
            </tbody>
          </table>
        </div>
        <div v-else class="download-empty">暂无可用的其他资源。</div>
      </div>

      <!-- 说明 -->
      <div class="section download-section">
        <div class="download-section-header">
          <h2 class="section-title">
            <i class="fas fa-info-circle me-2"></i>
            <span>说明与使用建议</span>
          </h2>
        </div>
        <div class="download-note">
          <ul>
            <li>部分资源可能仅对指定用户组或特殊权限开放，若想申请访问，请联系管理员。</li>
            <li>下载前请确认自己的账户积分是否足够；付费资源会在下载前扣减积分。</li>
            <li>为保证下载体验，建议在网络稳定的环境下进行下载。</li>
            <li>如遇到链接失效或文件损坏，请联系管理员协助处理。</li>
            <li>为了防止滥用，服务端会对频繁下载行为进行限制，请合理安排下载时间。</li>
            <li>请遵守社区规范，不要将下载链接公开传播；如需转载请联系管理员。</li>
            <li>下载的资源仅供学习和测试使用，禁止用于商业或非法用途。</li>
            <li>下载页会不定期更新，如需及时了解更新内容，可关注公告或联系我们。</li>
            <li>移动端查看时，表格支持横向滚动以避免内容挤压；如显示异常可切换至桌面端浏览器。</li>
          </ul>
        </div>
      </div>
    </div>
  </div>
</template>

<script setup>
import { ref, computed, onMounted } from 'vue';
import { useRouter } from 'vue-router';
import { useAuthStore } from '@/stores/auth';
import { fetchDownloads, accessDownload } from '@/api/download';
import { showErrorMessage, showInfoMessage } from '@/utils/messageBox.js';

const router = useRouter();
const auth = useAuthStore();

const loading = ref(true);
const errorMsg = ref('');
const hasAccess = ref(true); // 允许访问列表页

const downloads = ref([]);

// ===== 用户信息（保持原始） =====
const userRank = computed(() => Number(auth.user?.user_rank ?? auth.user?.rank ?? 0));
const userSpecialGroupRaw = computed(() => auth.user?.special_group ?? auth.user?.rankSp ?? '');

// 统一特殊组显示（不影响原逻辑）
const SG_ALIAS = { '1': 'maimoller', '2': 'coadmin', 'maimoller': 'maimoller', 'coadmin': 'coadmin' };
function normSg(v) {
  const s = String(v ?? '').trim().toLowerCase();
  return SG_ALIAS[s] || s;
}
const userSg = computed(() => normSg(userSpecialGroupRaw.value));

// ===== 分类（保持最原始） =====
const gameDownloads = computed(() =>
    downloads.value.filter(d => (d?.category ?? '').toString().toLowerCase() === 'game')
);
const archiveDownloads = computed(() =>
    downloads.value.filter(d => (d?.category ?? '').toString().toLowerCase() === 'archive')
);
const otherDownloads = computed(() =>
    downloads.value.filter(d => (d?.category ?? '').toString().toLowerCase() === 'other')
);

// 最后更新时间
function getLastUpdate(list) {
  if (!Array.isArray(list) || !list.length) return '';
  const times = list
      .map(d => d.last_update || d.updated_at || d.created_at)
      .filter(Boolean)
      .map(s => new Date(s).getTime())
      .filter(t => !isNaN(t));
  if (!times.length) return '';
  const latest = Math.max(...times);
  const dt = new Date(latest);
  const yyyy = dt.getFullYear();
  const mm = String(dt.getMonth() + 1).padStart(2, '0');
  const dd = String(dt.getDate()).padStart(2, '0');
  const hh = String(dt.getHours()).padStart(2, '0');
  const mi = String(dt.getMinutes()).padStart(2, '0');
  return `${yyyy}-${mm}-${dd} ${hh}:${mi}`;
}
const gameLastUpdate = computed(() => getLastUpdate(gameDownloads.value));
const archiveLastUpdate = computed(() => getLastUpdate(archiveDownloads.value));
const otherLastUpdate = computed(() => getLastUpdate(otherDownloads.value));

// ===== 权限显示 & 校验（与原版一致） =====
const accessLevelNames = {
  '-1': '不限',
  '0': '普通用户',
  '1': '初级用户',
  '2': '中级用户',
  '3': '高级用户',
  '4': '贵宾用户',
  '5': '系统管理员',
};
const specialGroupNames = { maimoller: 'maimoller', coadmin: '协同管理员' };

function formatAccessLevel(download) {
  const lvl = String(download?.access_level ?? download?.rank ?? 0);
  return accessLevelNames[lvl] || accessLevelNames['0'];
}
function formatSpecialGroup(download) {
  const sg = normSg(download?.special_group);
  return sg ? (specialGroupNames[sg] || sg) : '无';
}
function formatPoints(download) {
  const p = Number(download?.required_points ?? download?.points ?? 0);
  return p > 0 ? String(p) : '无';
}

/** ✅ 最小新增：根据 access_level 返回类名，让徽章能变色 */
function rankClass(download) {
  const lvl = Number(download?.access_level ?? download?.rank ?? 0);
  if (Number.isNaN(lvl)) return 'rank-0';
  if (lvl < 0) return 'rank-unlimited';
  return `rank-${lvl}`; // rank-0 ~ rank-5
}

function specialClass(download) {
  const sg = normSg(download?.special_group);
  if (!sg) return '';
  if (sg === 'maimoller') return 'special-maimoller';
  if (sg === 'coadmin') return 'special-coadmin';
  return `special-${sg}`;
}

/** 判定是否可访问：
 *  - access_level >= 0 时：userRank >= access_level
 *  - special_group 存在时：userSg == special_group
 */
function hasDownloadAccess(download) {
  let ok = true;
  const level = Number(download?.access_level ?? download?.rank ?? -1);
  if (!Number.isNaN(level) && level >= 0) ok = ok && (userRank.value >= level);
  const requiredSg = normSg(download?.special_group);
  if (requiredSg) ok = ok && (userSg.value === requiredSg);
  return ok;
}

// 行点击：权限校验 → 积分确认 → 记录访问 → 跳详情（params 传 id）
async function handleRowClick(download) {
  try {
    if (!hasDownloadAccess(download)) {
      showInfoMessage('权限不足或资源不可用');
      return;
    }
    const id = String(download?.id ?? download?._id ?? download?.download_id ?? download?.file_id ?? '');
    if (!id) {
      showErrorMessage('资源缺少ID，无法打开详情');
      return;
    }
    const pointCost = Number(download?.required_points ?? download?.points ?? 0);
    if (pointCost > 0) {
      const ok = confirm(`下载该资源需要消耗 ${pointCost} 积分，是否继续？`);
      if (!ok) return;
    }
    try { await accessDownload(id); } catch (_) {}
    router.push({ name: 'DownloadDetail', params: { id } });
  } catch (e) {
    console.error('[download] 跳转失败', e);
    showErrorMessage(e?.message || '无法打开详情页，请稍后再试');
  }
}

// 初始化：只做最小提取
function pickArray(res) {
  if (Array.isArray(res)) return res;
  if (Array.isArray(res?.data)) return res.data;
  if (Array.isArray(res?.list)) return res.list;
  if (Array.isArray(res?.items)) return res.items;
  if (Array.isArray(res?.data?.list)) return res.data.list;
  if (Array.isArray(res?.data?.items)) return res.data.items;
  if (Array.isArray(res?.data?.data)) return res.data.data;
  return [];
}

async function init() {
  try {
    errorMsg.value = '';
    loading.value = true;
    const res = await fetchDownloads();
    const list = pickArray(res).map(raw => ({
      ...raw,
      id: raw.id ?? raw._id ?? raw.download_id ?? raw.file_id ?? raw.uuid ?? raw.slug ?? undefined,
      title: raw.title ?? raw.name ?? '未命名资源',
    }));
    downloads.value = list;
  } catch (e) {
    console.error('[download] 加载下载列表失败', e);
    errorMsg.value = '下载列表加载失败，请稍后重试。';
  } finally {
    loading.value = false;
  }
}

onMounted(() => { init(); });

// 跳转
function goLogin() { router.push({ name: 'Login' }); }
function goHome() { router.push({ path: '/' }); }
function reload() { init(); }
</script>

<style scoped>
/* 容器 */
.section.download-section {
  background: #fff;
  border-radius: 14px;
  border: 1px solid #e9ecef;
  box-shadow: 0 4px 20px rgba(0,0,0,.06);
  padding: 1.25rem 1rem;
  margin-bottom: 1.25rem;
}

.download-section-header {
  display: flex;
  align-items: center;
  justify-content: space-between;
  gap: .75rem;
  margin-bottom: .5rem;
}

.section-title {
  font-size: 1.1rem;
  font-weight: 800;
  color: #1f2937;
  margin: 0;
}

.download-last-update {
  font-size: .85rem;
  color: #6b7280;
}

/* 表格外层容器：移动端可横向滚动 */
.download-table-wrapper {
  border: 1px solid #e9ecef;
  border-radius: 12px;
  overflow-x: auto;
  overflow-y: hidden;
  -webkit-overflow-scrolling: touch;
  touch-action: pan-x;
  box-shadow: 0 2px 12px rgba(0,0,0,.06);
}

.download-table {
  width: 100%;
  min-width: 920px; /* 6列保守值 */
  border-collapse: collapse;
  background: #fff;
}

.download-table thead th {
  background: #f8fafc;
  color: #334155;
  font-weight: 800;
  letter-spacing: .3px;
  font-size: .86rem;
}

.download-table th,
.download-table td {
  padding: .75rem .9rem;
  border-bottom: 1px solid #f1f5f9;
  vertical-align: middle;
}

.download-row:hover {
  background: rgba(102,126,234,.06);
}

.download-link {
  color: #667eea;
  font-weight: 700;
  text-decoration: none;
  display: inline-flex;
  align-items: center;
  background: #f1f5ff;
  padding: 0.25rem 0.5rem;
  border-radius: 8px;
  transition: all .2s ease;
}
.download-link:hover {
  color: #764ba2;
  background: #e8ecff;
  transform: translateX(2px);
}
.download-link i { font-size: 0.9rem; }

/* 徽章基础：不换行/不挤压，保留你原有灰色默认样式 */
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

  white-space: nowrap;
  word-break: keep-all;
  flex-shrink: 0;
  min-width: 0;

  /* 👉 所有等级：增强文字阴影 */
  text-shadow: 0 1px 1px rgba(0, 0, 0, .25);
}

.special-badge {
  display: inline-flex;
  align-items: center;
  padding: 0.2rem 0.5rem;
  border-radius: 999px;
  font-size: 0.78rem;
  background: #fff3bf;
  color: #856404;

  white-space: nowrap;
  word-break: keep-all;
  flex-shrink: 0;
  min-width: 0;
}

.points-badge {
  display: inline-flex;
  align-items: center;
  padding: 0.25rem 0.6rem;
  border-radius: 999px;
  font-size: 0.8rem;
  background: #fff4e6;
  color: #d9480f;
}

/* ===== 访问权限徽章配色（仅影响徽章本身） ===== */
/* 0=普通用户：保持上面的灰色默认，不再覆写 */

/* 1=初级用户：铜色 */
.access-badge.rank-1 {
  background: linear-gradient(135deg, #CD7F32 0%, #A96E2D 100%);
  color: #fff;
  border: 1px solid #8b5a2b;
}

/* 2=中级用户：蓝色 */
.access-badge.rank-2 {
  background: linear-gradient(135deg, #4A90E2 0%, #2B6CB0 100%);
  color: #fff;
}

/* 3=高级用户：深色金色 */
.access-badge.rank-3 {
  background: linear-gradient(135deg, #8D5E0A 0%, #D4AF37 100%);
  color: #fff;
  border: 1px solid rgba(141, 94, 10, .6);
}

/* 4=贵宾用户：浅金色（浅底深字，并稍调文字阴影） */
.access-badge.rank-4 {
  background: linear-gradient(135deg, #FFF3C4 0%, #FFE9A7 100%);
  color: #8B4513;
  border: 1px solid #F0C36D;
  text-shadow: 0 1px 0 rgba(255,255,255,.6), 0 -1px 0 rgba(0,0,0,.08);
}

/* 5=系统管理员：七彩渐变 */
.access-badge.rank-5 {
  background: linear-gradient(135deg,
  #FF0000 0%,
  #FF7F00 16%,
  #FFFF00 32%,
  #00FF00 48%,
  #0000FF 64%,
  #4B0082 82%,
  #8A2BE2 100%
  );
  color: #fff;
  border: 1px solid rgba(0,0,0,.15);
}

/* 可选：-1=不限 */
.access-badge.rank-unlimited {
  background: linear-gradient(135deg, #28a745 0%, #20c997 100%);
  color: #fff;
}

/* 空状态 & 说明 */
.download-empty { padding: 1.2rem 0.5rem 0.3rem; font-size: 0.9rem; color: #868e96; }
.download-note { font-size: .95rem; color: #475569; }
.download-note ul { margin: .5rem 0 0; padding-left: 1.25rem; }
.download-note li { margin: .25rem 0; }

/* 响应式（保持可横向滚动） */
@media (max-width: 768px) {
  .section.download-section { padding: 1.25rem 1rem; margin-bottom: 1.5rem; }
  .download-section-header { flex-direction: column; align-items: flex-start; }
  .download-table-wrapper { margin: 0 -0.75rem; padding: 0 0.75rem; overflow-x: auto; -webkit-overflow-scrolling: touch; touch-action: pan-x; }
  .download-table th, .download-table td { white-space: nowrap; }
  .download-link { white-space: normal; }
}
</style>
