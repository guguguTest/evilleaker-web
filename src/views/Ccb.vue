<template>
  <div class="section ccb-page" :key="$i18n.locale">
    <h1 class="page-title">{{ $t('ccb.pageTitle') }}</h1>

    <div class="ccb-container" v-if="!store.loading">
      <!-- 卡片管理 -->
      <div class="ccb-section">
        <h2 class="ccb-title">{{ $t('ccb.cardManageTitle') }}</h2>

        <div class="ccb-card-selector">
          <button
              v-for="slot in [1,2,3]"
              :key="slot"
              class="ccb-card-btn"
              :class="{ selected: store.activeSlot===slot, unbound: !store.isSlotBound(slot) }"
              @click="onSelectSlot(slot)"
          >
            <!-- 主卡片徽标：仅当 localPrimarySlot===slot 时显示 -->
            <div v-if="localPrimarySlot===slot" class="primary-ribbon">
              <i class="fas fa-crown"></i>&nbsp;{{ $t('ccb.primaryBadge') }}
            </div>

            <!-- 居中显示标题与状态 -->
            <div class="slot-title">{{ i18nCardTitle(slot) }}</div>
            <div
                class="slot-status"
                :class="store.isSlotBound(slot) ? 'ok' : 'warn'"
            >
              <i v-if="store.isSlotBound(slot)" class="fas fa-check-circle"></i>
              <i v-else class="fas fa-exclamation-circle"></i>
              <span>{{ store.isSlotBound(slot) ? $t('ccb.status.bound') : $t('ccb.status.unbound') }}</span>
            </div>
          </button>
        </div>

        <!-- 居中工具栏 -->
        <div class="ccb-card-toolbar">
          <button class="ccb-btn ccb-btn-danger small" @click="onUnbindAll">
            {{ $t('ccb.unbindAll') }}
          </button>
          <button
              class="ccb-btn ccb-btn-primary small"
              :disabled="!store.isSlotBound(store.activeSlot)"
              @click="onSwitchActive"
              v-if="store.isSlotBound(store.activeSlot)"
          >
            <i class="fas fa-exchange-alt"></i> {{ $t('ccb.setPrimary') }}
          </button>
        </div>
      </div>

      <!-- 未绑定：绑定表单 -->
      <div v-if="!store.isSlotBound(store.activeSlot)" class="ccb-section">
        <h2 class="ccb-title">{{ $t('ccb.bind.title', { slot: store.activeSlot }) }}</h2>

        <form class="ccb-form" @submit.prevent="submitBind">
          <div class="form-group">
            <label for="server">{{ $t('ccb.server') }}</label>
            <select id="server" v-model="form.server" required>
              <option value="">{{ $t('ccb.server.select') }}</option>
              <option v-for="s in store.servers" :key="s.server_url" :value="s.server_url">
                {{ s.server_name }}
              </option>
            </select>
            <small class="hint" v-if="serverError">{{ serverError }}</small>
          </div>

          <div class="form-group">
            <label>{{ $t('ccb.guid.label') }}</label>
            <div class="guid-input-container">
              <input
                  v-model="form.guid"
                  @input="form.guid = store.normalizeGuid(form.guid)"
                  maxlength="20" required :placeholder="$t('ccb.guid.label')"/>
              <button type="button" class="scan-btn" @click="openScan">
                <i class="fas fa-camera"></i><span>{{ $t('ccb.scan') }}</span>
              </button>
            </div>
            <small class="hint" :class="{ 'err': guidError }">
              {{ guidError || $t('ccb.hint.guid') }}
            </small>
          </div>

          <div class="form-group">
            <label>{{ $t('ccb.keychip.label') }}</label>
            <input
                v-model="form.keychip"
                @input="onKeychipInput"
                maxlength="20" required placeholder="AXXXXXXXXXXX"/>
            <small class="hint" :class="{ 'err': keychipError }">
              {{ keychipError || $t('ccb.hint.keychip') }}
            </small>
            <div class="checkbox-group">
              <input type="checkbox" id="default-keychip" v-model="useDefaultKeychip" />
              <label for="default-keychip">{{ $t('ccb.keychip.default') }}</label>
            </div>
          </div>

          <!-- 拖拽/点击选择文件 区域 -->
          <div
              class="dropzone"
              @dragover.prevent="onDragOver"
              @dragleave.prevent="onDragLeave"
              @drop.prevent="onDrop"
              @click="triggerFileSelect"
              :class="{ 'dragover': isDragOver }"
          >
            <input ref="fileInput" class="hidden-file" type="file" accept=".txt" @change="onFileChange">
            <div class="dz-inner">
              <div class="dz-title"><i class="fas fa-file-upload"></i> {{ $t('ccb.drop.title') }}</div>
              <div class="dz-desc">{{ $t('ccb.drop.desc') }}</div>
            </div>
          </div>

          <div class="ccb-actions">
            <button class="ccb-btn ccb-btn-primary"
                    :disabled="store.loading || bindBusy || !canSubmitBind">
              {{ bindBusy ? '...' : $t('ccb.bind.submit', { slot: store.activeSlot }) }}
            </button>
          </div>
        </form>
      </div>

      <!-- 已绑定：查询分数 -->
      <div v-else class="ccb-section">
        <h2 class="ccb-title">{{ $t('ccb.query.title') }}</h2>
        <p class="now-using">
          {{ $t('ccb.primary.now', { slot: primarySlotDisplay }) }}
          &nbsp;|&nbsp; {{ $t('ccb.server') }}：<strong>{{ store.currentServerName }}</strong>
        </p>

        <form class="ccb-form" @submit.prevent="submitQuery">
          <div class="form-group">
            <label for="game">{{ $t('ccb.chooseGame') }}</label>
            <select id="game" v-model="selectedGame" required>
              <option value="">{{ $t('ccb.chooseGamePlaceholder') }}</option>
              <option v-for="g in store.games" :key="g.game_title" :value="g.game_title">
                {{ g.game_name }}
              </option>
            </select>
          </div>

          <!-- 原版提示样式 -->
          <div class="ccb-notice">
            <h4 class="ccb-notice-title"><i class="fas fa-exclamation-circle"></i>&ensp;{{ $t('ccb.notice.title') }}</h4>
            <p class="ccb-notice-content" v-html="$t('ccb.notice.html')"></p>
          </div>

          <div class="ccb-actions">
            <button id="query-btn" class="ccb-btn ccb-btn-primary"
                    :disabled="store.querying || store.cooldownLeft>0">
              {{ store.querying ? '...' : $t('ccb.query') }}
            </button>
            <button v-if="store.querying" type="button" class="ccb-btn ccb-btn-secondary" @click="cancelQuery">
              {{ $t('ccb.cancelQuery') }}
            </button>
            <button type="button" class="ccb-btn ccb-btn-danger" @click="onUnbindCurrent">
              {{ $t('ccb.unbindCurrent') }}
            </button>
          </div>

          <!-- 当前积分 + 刷新 -->
          <div class="ccb-points-panel">
            <div class="points-text">{{ $t('ccb.points.panelLabel') }}<span class="points">{{ store.points }}</span></div>
            <button type="button" class="refresh-points-btn" @click="store.refreshPoints">
              <i class="fas fa-redo"></i> {{ $t('ccb.refresh') }}
            </button>
            <span v-if="refreshOK" class="refresh-ok">{{ $t('ccb.refreshed') }}</span>
          </div>

          <div v-if="store.cooldownLeft>0" class="ccb-cooldown">
            {{ $t('ccb.cooldown', { sec: store.cooldownLeft }) }}
          </div>
        </form>

        <div class="ccb-section result-section">
          <h2 class="ccb-title">{{ $t('ccb.result.title') }}</h2>
          <div class="ccb-result">
            <template v-if="store.lastImageDataUrl">
              <div class="ccb-result-container">
                <img class="result-img" :key="store.lastImageDataUrl" :src="store.lastImageDataUrl" alt="result" @error="onImgError">
                <div class="ccb-save-action">
                  <button class="ccb-btn ccb-btn-primary" @click="saveImage">{{ $t('ccb.saveImage') }}</button>
                </div>
              </div>
            </template>
            <template v-else>
              <div class="empty"><i class="far fa-image"></i> {{ $t('ccb.result.empty') }}</div>
            </template>
          </div>
        </div>
      </div>
    </div>

    <div v-else class="loading">{{ loadingText }}</div>

    <!-- 扫码弹窗（如需 i18n，可同样替换为 $t） -->
    <div v-if="scanOpen" class="scan-modal">
      <div class="scan-modal-content">
        <div class="scan-modal-header">
          <h2 class="scan-modal-title"><i class="fas fa-camera"></i> 扫描卡片</h2>
          <button class="scan-modal-close ccb-btn" @click="closeScan">×</button>
        </div>
        <div class="scan-tips">
          <div class="scan-tips-title"><i class="fas fa-info-circle"></i> 扫描提示</div>
          <ul class="scan-tips-list">
            <li>将卡片平放在摄像头前</li>
            <li>确保 ACCESS CODE 区域清晰可见</li>
            <li>保持卡片稳定，系统会自动识别</li>
          </ul>
        </div>
        <div class="scan-video-container">
          <video ref="videoEl" autoplay playsinline></video>
          <div class="scan-overlay">
            <div class="scan-frame"><div class="scan-line"></div></div>
          </div>
        </div>
        <div class="scan-modal-footer">
          <button class="ccb-btn ccb-btn-secondary" @click="closeScan">关闭</button>
        </div>
      </div>
    </div>
  </div>
</template>

<script setup>
import { onMounted, reactive, ref, watch, onBeforeUnmount, computed } from 'vue';
import { useI18n } from 'vue-i18n';
import { useCcbStore } from '@/stores/ccb';
import { ElMessage, ElMessageBox } from 'element-plus';

const { t } = useI18n();
const store = useCcbStore();

const form = reactive({ server:'', guid:'', keychip:'' });
const useDefaultKeychip = ref(false);

/** 统一获取卡片标题（支持 1/2/3 独立键名 & 通用键名 & 兜底） */
function i18nCardTitle(slot) {
  const specificKey = `ccb.cardSlotTitle${slot}`;
  const sp = t(specificKey);
  if (sp !== specificKey) return sp;

  const genericKey = 'ccb.cardSlotTitle';
  const gen = t(genericKey, { slot });
  if (gen !== genericKey) return gen;

  // fallback: common.card + 序号
  const common = t('common.card');
  return (common === 'common.card' ? '卡片' : common) + String(slot);
}

/* ===================== 主卡片：刷新后依旧显示 ===================== */
const localPrimarySlot = ref(null);

/** 从 store 推断主卡槽位（尽量兼容不同字段命名） */
function inferPrimaryFromStore() {
  const cand =
      store.primarySlot ??
      store.serverPrimarySlot ??
      store.active_slot ??
      store.user?.ccb_active_slot ??
      store.profile?.ccb_active_slot ??
      null;

  if ([1,2,3].includes(cand)) return cand;

  // 兼容：从 bindings 里寻找 primary 标志
  try {
    const b = store.bindings || {};
    const marks = {
      1: b.card1?.primary ?? b.card1?.is_primary ?? b.card1?.isPrimary,
      2: b.card2?.primary ?? b.card2?.is_primary ?? b.card2?.isPrimary,
      3: b.card3?.primary ?? b.card3?.is_primary ?? b.card3?.isPrimary,
    };
    const hit = [1,2,3].find(i => !!marks[i]);
    if (hit) return hit;
  } catch {}
  return null;
}

/** 同步本地主卡（优先后端，其次本地缓存） */
function syncPrimaryFromStoreOrLocal() {
  let s = inferPrimaryFromStore();
  if (![1,2,3].includes(s)) {
    const ls = Number(localStorage.getItem('ccb_primary_slot'));
    if ([1,2,3].includes(ls)) s = ls;
  }
  if ([1,2,3].includes(s)) localPrimarySlot.value = s;
}

/** 监听 store 字段变化，拿到数据后立即同步 */
watch(
    () => [
      store.primarySlot,
      store.serverPrimarySlot,
      store.active_slot,
      store.user,
      store.profile,
      store.bindings,
    ],
    () => {
      const s = inferPrimaryFromStore();
      if ([1,2,3].includes(s) && s !== localPrimarySlot.value) {
        localPrimarySlot.value = s;
        localStorage.setItem('ccb_primary_slot', String(s));
      }
    },
    { deep: true }
);

/* ===================== 服务器/表单逻辑 ===================== */
watch([() => store.servers, () => store.activeSlot, () => store.bindings], () => {
  const b = store.currentBinding;
  if (b?.game_server) form.server = b.game_server;
}, { immediate: true, deep: true });

watch(useDefaultKeychip, (v) => { form.keychip = v ? 'A63E01A8888' : ''; });
function onKeychipInput() {
  let x = String(form.keychip || '').replace(/[^A-Za-z0-9]/g, '');
  x = x.toUpperCase();
  if (x.length >= 15) x = x.slice(0, 11);
  x = x.slice(0, 11);
  form.keychip = x;
}

const bindBusy = ref(false);
const selectedGame = ref('');
const refreshOK = ref(false);

/* ===================== 校验文案（i18n） ===================== */
const guidError = computed(() => {
  const g = (form.guid || '').trim();
  if (!g) return '';
  if (!/^\d{20}$/.test(g)) return t('ccb.err.guid');
  return '';
});
const keychipError = computed(() => {
  const k = (form.keychip || '').trim();
  if (!k) return '';
  if (!/^A[A-Z0-9]{10}$/.test(k)) return t('ccb.err.keychip');
  return '';
});
const serverError = computed(() => {
  const s = form.server;
  if (!s) return '';
  const ok = store.servers.some(x => x.server_url === s);
  return ok ? '' : t('ccb.err.serverInvalid');
});
const canSubmitBind = computed(() =>
    !!form.server && !serverError.value &&
    !!form.guid && !guidError.value &&
    !!form.keychip && !keychipError.value
);

/** 初始化：先 bootstrap，再同步主卡（避免 mounted 时机过早） */
onMounted(async () => {
  try {
    await store.bootstrap();
    syncPrimaryFromStoreOrLocal();
  } catch (e) {
    ElMessage.error((e && e.message) || '初始化失败，请稍后重试'); // 可选：加入 i18n
  }
});

function onSelectSlot(slot) { store.setActiveSlot(slot); }

async function onSwitchActive() {
  if (!store.isSlotBound(store.activeSlot)) return;
  try {
    await ElMessageBox.confirm(
        t('ccb.confirm.switch', { slot: store.activeSlot }),
        t('common.confirm'),
        { type: 'warning' }
    );
  } catch { return; }
  try {
    await store.switchActive(store.activeSlot);
    localPrimarySlot.value = store.activeSlot;
    localStorage.setItem('ccb_primary_slot', String(store.activeSlot));
    ElMessage.success(t('ccb.msg.switchSuccess'));
  } catch (e) {
    ElMessage.error(t('ccb.msg.switchFailed'));
  }
}

async function onUnbindAll() {
  try {
    await ElMessageBox.confirm(
        t('ccb.confirm.unbindAll'),
        t('common.confirm'),
        { type: 'warning' }
    );
  } catch { return; }
  try {
    await store.unbindAll();
    localPrimarySlot.value = null;
    localStorage.removeItem('ccb_primary_slot');
    ElMessage.success(t('ccb.msg.unbindAllSuccess'));
  } catch (e) {
    ElMessage.error((e && e.message) || '解绑失败'); // 可选：加入 i18n
  }
}

async function onUnbindCurrent() {
  try {
    await ElMessageBox.confirm(
        t('ccb.confirm.unbindCurrent', { slot: store.activeSlot }),
        t('common.confirm'),
        { type: 'warning' }
    );
  } catch { return; }
  try {
    const unbound = store.activeSlot;
    await store.unbindSlot(unbound);
    if (localPrimarySlot.value === unbound) {
      const next = [1,2,3].find(s => store.isSlotBound(s)) ?? null;
      localPrimarySlot.value = next;
      if (next) localStorage.setItem('ccb_primary_slot', String(next));
      else localStorage.removeItem('ccb_primary_slot');
    }
    ElMessage.success(t('ccb.msg.unbindSuccess'));
  } catch (e) {
    ElMessage.error((e && e.message) || '解绑失败'); // 可选：加入 i18n
  }
}

async function submitBind() {
  if (!canSubmitBind.value) {
    if (!form.server) ElMessage.error(t('ccb.server.select'));
    else if (serverError.value) ElMessage.error(serverError.value);
    else if (!form.guid) ElMessage.error(t('ccb.err.guid'));
    else if (guidError.value) ElMessage.error(guidError.value);
    else if (!form.keychip) ElMessage.error(t('ccb.err.keychip'));
    else if (keychipError.value) ElMessage.error(keychipError.value);
    return;
  }

  bindBusy.value = true;
  try {
    await store.bindCard({
      slot: store.activeSlot,
      game_server: form.server,
      keychip: form.keychip,
      guid: store.normalizeGuid(form.guid)
    });
    ElMessage.success(t('ccb.msg.bindSuccess'));
    // 绑定不会自动成为主卡，不更新 localPrimarySlot
  } catch (e) {
    ElMessage.error(t('ccb.msg.bindFailed'));
  } finally {
    bindBusy.value = false;
  }
}

async function submitQuery() {
  store.resetResult();
  try {
    await store.queryScore(selectedGame.value);
    refreshOK.value = true;
    setTimeout(() => (refreshOK.value = false), 1500);
  } catch (e) {
    if (e?.code === 'ERR_CANCELED') ElMessage.info(t('ccb.cancelQuery'));
    else ElMessage.error((e && e.message) || '查询失败'); // 可选：加入 i18n
  }
}
function cancelQuery() { store.cancelQuery(); }

function onImgError() { ElMessage.error('图片加载失败，可能是返回数据异常，请重试一次。'); } // 可选：加入 i18n
function saveImage() {
  if (!store.lastImageDataUrl) return;
  const link = document.createElement('a');
  const ts = new Date().toISOString().replace(/[:.]/g, '-');
  link.href = store.lastImageDataUrl;
  link.download = `ccb_card${store.activeSlot}_${ts}.png`;
  document.body.appendChild(link);
  link.click();
  document.body.removeChild(link);
}

/** —— 拖拽/选择文件读取卡号 —— */
const isDragOver = ref(false);
const fileInput = ref(null);

function onDragOver() { isDragOver.value = true; }
function onDragLeave() { isDragOver.value = false; }
async function onDrop(e) {
  isDragOver.value = false;
  const file = e.dataTransfer?.files?.[0];
  if (!file) return;
  await processFile(file);
}
function triggerFileSelect() { fileInput.value?.click(); }
async function onFileChange(e) {
  const file = e.target?.files?.[0];
  if (!file) return;
  await processFile(file);
  e.target.value = '';
}
async function processFile(file) {
  const name = (file.name || '').toLowerCase().trim();
  if (name !== 'aime.txt' && name !== 'felica.txt') {
    ElMessage.error(t('ccb.err.fileType'));
    return;
  }
  const text = await file.text();

  if (name === 'aime.txt') {
    const digits = text.replace(/\D/g, '');
    if (digits.length < 20) {
      ElMessage.error(t('ccb.err.aime'));
      return;
    }
    form.guid = store.normalizeGuid(digits.slice(0, 20));
    ElMessage.success('OK'); // 可选：加入成功提示键
  } else {
    const hex = text.replace(/[^0-9A-Fa-f]/g, '').slice(0, 16);
    if (hex.length !== 16) {
      ElMessage.error(t('ccb.err.felicaLen'));
      return;
    }
    try {
      const dec = BigInt('0x' + hex).toString(10);
      const padded = dec.padStart(20, '0').slice(0, 20);
      form.guid = store.normalizeGuid(padded);
      ElMessage.success('OK'); // 可选：加入成功提示键
    } catch {
      ElMessage.error(t('ccb.err.felicaConv'));
    }
  }
}

/** —— 扫码 —— */
const scanOpen = ref(false);
const videoEl = ref(null);
let stream = null;
let scanTimer = null;
function openScan() { scanOpen.value = true; startScan(); }
function closeScan() { scanOpen.value = false; stopScan(); }
async function startScan() {
  try {
    stream = await navigator.mediaDevices.getUserMedia({
      video: { facingMode: 'environment', width: { ideal: 1920 }, height: { ideal: 1080 } }
    });
    if (videoEl.value) {
      videoEl.value.srcObject = stream;
      videoEl.value.onloadedmetadata = () => { videoEl.value.play(); };
    }
    let detector = null;
    if ('BarcodeDetector' in window) {
      try { detector = new window.BarcodeDetector({ formats: ['code_128','code_39','ean_13','qr_code'] }); } catch { detector = null; }
    }
    const useDetector = !!detector;
    const Tesseract = useDetector ? null : await ensureTesseract();
    scanTimer = setInterval(async () => {
      if (!videoEl.value) return;
      const canvas = document.createElement('canvas');
      canvas.width = videoEl.value.videoWidth; canvas.height = videoEl.value.videoHeight;
      const ctx = canvas.getContext('2d'); ctx.drawImage(videoEl.value, 0, 0);
      if (useDetector) {
        try {
          const bitmap = await createImageBitmap(canvas);
          const codes = await detector.detect(bitmap); bitmap.close();
          if (codes && codes.length) {
            const raw = (codes[0].rawValue || '').toString();
            const code = extractAccessCode(raw);
            if (code) { form.guid = store.normalizeGuid(code); closeScan(); }
          }
        } catch {}
      } else if (Tesseract) {
        try {
          const blob = await new Promise(r => canvas.toBlob(r, 'image/png')); if (!blob) return;
          const { data: { text } } = await Tesseract.recognize(blob, 'eng', { logger: () => {} });
          const code = extractAccessCode(text);
          if (code) { form.guid = store.normalizeGuid(code); closeScan(); }
        } catch {}
      }
    }, 900);
  } catch { stopScan(); ElMessage.error(t('ccb.err.camera')); }
}
function stopScan() { if (scanTimer) { clearInterval(scanTimer); scanTimer=null; } if (stream) { stream.getTracks().forEach(t=>t.stop()); stream=null; } }
onBeforeUnmount(stopScan);
async function ensureTesseract() { if (window.Tesseract) return window.Tesseract;
  await new Promise((resolve,reject)=>{ const s=document.createElement('script'); s.src='https://cdn.jsdelivr.net/npm/tesseract.js@5/dist/tesseract.min.js'; s.onload=resolve; s.onerror=reject; document.head.appendChild(s); });
  return window.Tesseract;
}
function extractAccessCode(text) {
  if (!text) return null;
  const unified = String(text).replace(/[\s\r\n-]/g, '');
  const direct = unified.match(/(\d{20})/); if (direct) return direct[1];
  const digits = unified.replace(/\D/g, ''); if (digits.length >= 20) {
    for (let i=0; i<=digits.length-20; i++) {
      const cand = digits.slice(i, i+20);
      if (!/^(\d)\1{19}$/.test(cand)) return cand;
    }
  } return null;
}

/* “加载中”文本：若缺少 common.loading，则回退中文 */
const loadingText = computed(() => {
  const key = 'common.loading';
  const v = t(key);
  return v === key ? '加载中...' : v;
});

const primarySlotDisplay = computed(() => localPrimarySlot.value ?? '—');
</script>

<style scoped>
/* 变量兜底 */
.ccb-page {
  --modern-card-background: rgba(255,255,255,0.92);
  --modern-shadow-light: 0 2px 10px rgba(0,0,0,0.06);
  --modern-shadow-medium: 0 6px 20px rgba(0,0,0,0.10);
  --modern-primary-color: #2563eb;
  --modern-secondary-color: #111827;
  --modern-error-color: #ef4444;
  --modern-success-color: #16a34a;
  --modern-text-primary: #1f2937;
  --modern-text-secondary: #6b7280;
  --modern-border-color: #e5e7eb;
  --modern-border-radius: 12px;
  --modern-border-radius-small: 8px;
  --modern-transition: all .25s ease;
  --modern-primary-gradient: linear-gradient(135deg,#3182ce 0%,#6366f1 100%);
  --modern-error-gradient: linear-gradient(135deg,#f43f5e 0%,#ef4444 100%);
  --modern-warning-gradient: linear-gradient(135deg,#f59e0b33 0%, #ef444433 100%);
}

.ccb-container { max-width: 920px; margin: 0 auto; padding: 20px; position: relative; }
.ccb-section { background: var(--modern-card-background); backdrop-filter: blur(14px); -webkit-backdrop-filter: blur(14px); border: 1px solid var(--modern-border-color); border-radius: var(--modern-border-radius); box-shadow: var(--modern-shadow-light); padding: 18px; margin-bottom: 16px; }
.ccb-title { font-size: 18px; margin: 0 0 12px; color: var(--modern-text-primary); }
.now-using { margin: 6px 0 14px; color: var(--modern-text-secondary); }

/* —— 卡片管理（响应式） —— */
.ccb-card-selector {
  display: grid;
  grid-template-columns: repeat(3, 1fr);
  gap: 12px;
  margin-top: 8px;
}
@media (max-width: 640px) {
  .ccb-card-selector { grid-template-columns: 1fr; }
}

.ccb-card-btn {
  position: relative;
  display: grid;
  place-items: center;
  gap: 8px;
  border: 1.5px solid var(--modern-border-color);
  border-radius: 12px;
  padding: 16px 12px;
  background: #fafafa;
  cursor: pointer;
  box-shadow: var(--modern-shadow-light);
  color: var(--modern-text-primary);
  transition: var(--modern-transition);
  text-align: center;
  min-height: 86px;
}
.ccb-card-btn:hover { transform: translateY(-1px); box-shadow: 0 6px 18px rgba(0,0,0,.08); }
.ccb-card-btn.selected { border-color: #93c5fd; box-shadow: 0 0 0 2px rgba(147,197,253,.25); background: #f8fbff; }
.ccb-card-btn.unbound { opacity: .97; }

@media (max-width: 640px) {
  .ccb-card-btn { padding: 12px 10px; min-height: 72px; }
}

.slot-title { font-weight: 800; font-size: 18px; letter-spacing: .5px; }
.slot-status {
  display: inline-flex; align-items: center; gap: 6px;
  font-size: 13px; padding: 4px 10px; border-radius: 999px;
  border: 1px solid var(--modern-border-color); background: #fff;
}
.slot-status.ok { color: var(--modern-success-color); border-color: #bbf7d0; background: #f0fdf4; }
.slot-status.warn { color: var(--modern-error-color); border-color: #fecaca; background: #fff1f2; }

/* 主卡片徽标 */
.primary-ribbon {
  position: absolute; top: 8px; right: 8px;
  background: var(--modern-primary-gradient);
  color: #fff; font-weight: 800; font-size: 12px;
  padding: 4px 10px; border-radius: 999px;
  box-shadow: 0 6px 18px rgba(99,102,241,.25);
  display: inline-flex; align-items: center; justify-content: center;
}

.ccb-card-toolbar { display: flex; gap: 8px; margin-top: 8px; justify-content: center; }

/* —— 表单/扫描/拖拽 —— */
.ccb-form { display: grid; gap: 16px; }
.form-group label { display:block; font-weight: 600; margin-bottom: 6px; color: var(--modern-text-primary); }
.form-group input, .form-group select { width: 100%; height: 40px; border: 1px solid var(--modern-border-color); border-radius: 8px; padding: 0 12px; outline: none; color: var(--modern-text-primary); background: #fff; transition: box-shadow .2s ease, border-color .2s ease; }
.form-group input:focus, .form-group select:focus { border-color: var(--modern-primary-color); box-shadow: 0 0 0 3px rgba(37,99,235,.15); }

.guid-input-container { display: flex; gap: 8px; align-items: center; }
.guid-input-container input { flex: 1 1 auto; min-width: 0; }
.scan-btn {
  display: inline-flex; align-items: center; gap: 6px;
  height: 40px; padding: 0 14px; border-radius: 8px;
  border: none; cursor: pointer; white-space: nowrap;
  background: var(--modern-primary-gradient); color: #fff;
  box-shadow: var(--modern-shadow-light); transition: var(--modern-transition);
}
.scan-btn:hover { transform: translateY(-2px); box-shadow: var(--modern-shadow-medium); }

.checkbox-group { display: inline-flex; align-items: center; gap: 8px; margin-top: 6px; }
.checkbox-group input[type="checkbox"] { appearance: auto; -webkit-appearance: auto; width: 16px; height: 16px; margin: 0 6px 0 0; transform: none; vertical-align: middle; }
.checkbox-group label { display: inline-flex; align-items: center; }

.hint { color: var(--modern-text-secondary); margin-top: 4px; display: block; }
.hint.err { color: var(--modern-error-color); }

/* 拖拽 */
.dropzone { border: 1px dashed var(--modern-border-color); border-radius: 10px; padding: 14px; background: #fbfbfd; cursor: pointer; transition: var(--modern-transition); }
.dropzone.dragover { border-color: var(--modern-primary-color); box-shadow: 0 0 0 3px rgba(37,99,235,.12); }
.hidden-file { display: none; }
.dz-inner { text-align: center; color: var(--modern-text-secondary); }
.dz-title { font-weight: 700; margin-bottom: 4px; color: var(--modern-text-primary); }
.dz-desc b { color: var(--modern-secondary-color); }

/* —— 按钮/提示/积分/结果 —— */
.ccb-actions { display: flex; gap: 10px; flex-wrap: wrap; }
.ccb-btn { display: inline-flex; align-items: center; justify-content: center; padding: 10px 20px; border: none; border-radius: var(--modern-border-radius-small); cursor: pointer; font-weight: 600; font-size: 14px; transition: var(--modern-transition); position: relative; overflow: hidden; text-transform: uppercase; letter-spacing: .5px; box-shadow: var(--modern-shadow-light); }
.ccb-btn::before { content: ''; position: absolute; top: 0; left: -100%; width: 100%; height: 100%; background: linear-gradient(90deg, transparent, rgba(255,255,255,0.3), transparent); transition: left .5s; }
.ccb-btn:hover::before { left: 100%; }
.ccb-btn-primary { background: var(--modern-primary-gradient); color: #fff; }
.ccb-btn-primary:hover { transform: translateY(-2px); box-shadow: var(--modern-shadow-medium); }
.ccb-btn-secondary { background: linear-gradient(135deg,#64748b 0%, #94a3b8 100%); color: #fff; }
.ccb-btn-secondary:hover { transform: translateY(-2px); box-shadow: var(--modern-shadow-medium); }
.ccb-btn-danger { background: var(--modern-error-gradient); color: #fff; }
.ccb-btn-danger:hover { transform: translateY(-2px); box-shadow: var(--modern-shadow-medium); }
.ccb-btn:disabled { opacity: .6; cursor: not-allowed; }
.small { height: 34px; font-size: 13px; }

.ccb-notice { background: var(--modern-warning-gradient); border: none; border-radius: var(--modern-border-radius); padding: 14px; margin: 12px 0; box-shadow: var(--modern-shadow-light); position: relative; overflow: hidden; }
.ccb-notice::before { content: ''; position: absolute; top: 0; left: 0; right: 0; height: 3px; background: linear-gradient(90deg, #ff9a56, #ff6b35); }
.ccb-notice-title { font-size: 13px; font-weight: 700; margin-bottom: 6px; color: #8b4513; display: flex; align-items: center; gap: 6px; }
.ccb-notice-content { font-size: 12px; color: #8b4513; line-height: 1.5; font-weight: 500; }
.ccb-notice-content b { color: #d2691e; font-weight: 700; }

.ccb-points-panel { display: flex; align-items: center; gap: 10px; margin-top: 10px; background: #f8fafc; border: 1px solid var(--modern-border-color); border-radius: 10px; padding: 10px 12px; }
.points-text { color: var(--modern-text-primary); font-weight: 600; }
.points-text .points { font-weight: 800; margin-left: 2px; }
.refresh-points-btn { margin-left: auto; padding: 8px 14px; border: none; border-radius: var(--modern-border-radius-small); background: linear-gradient(135deg, #4ECDC4 0%, #44A08D 100%); color: white; cursor: pointer; font-weight: 700; font-size: 13px; transition: var(--modern-transition); box-shadow: var(--modern-shadow-light); display: inline-flex; align-items: center; gap: 6px; }
.refresh-points-btn:hover { transform: translateY(-2px); box-shadow: var(--modern-shadow-medium); }
.refresh-ok { color: var(--modern-success-color); font-weight: 600; margin-left: 8px; }
.ccb-cooldown { margin-top: 8px; color: var(--modern-error-color); font-weight: 600; }

.result-section { margin-top: 16px; }
.ccb-result .empty { color: var(--modern-text-secondary); font-size: 14px; display: grid; place-items: center; min-height: 160px; border: 1px dashed var(--modern-border-color); border-radius: 10px; background: #fbfbfd; }
.ccb-result-container { display: grid; justify-items: center; gap: 12px; }
.result-img { max-width: 100%; height: auto; border: 1px solid var(--modern-border-color); border-radius: 10px; box-shadow: var(--modern-shadow-light); }
.ccb-save-action { display: flex; gap: 10px; }

/* 扫码弹窗 */
.scan-modal { position: fixed; inset: 0; background: rgba(0,0,0,.6); display: grid; place-items: center; z-index: 9999; }
.scan-modal-content { width: min(720px, 92vw); background: #fff; border-radius: 12px; padding: 16px; display: grid; gap: 12px; box-shadow: var(--modern-shadow-medium); }
.scan-modal-header { display: flex; align-items: center; justify-content: space-between; }
.scan-modal-title { margin: 0; font-size: 18px; color: var(--modern-text-primary); }
.scan-modal-close { background: transparent; border: none; font-size: 20px; cursor: pointer; }
.scan-modal-footer { display:flex; justify-content:flex-end; gap:10px; }
.scan-tips { background: #f8fafc; border: 1px solid var(--modern-border-color); border-radius: 10px; padding: 10px; }
.scan-tips-title { font-weight: 700; margin-bottom: 6px; color: var(--modern-text-primary); }
.scan-tips-list { margin: 0; padding-left: 18px; color: #334155; }
.scan-video-container { position: relative; background: #000; border-radius: 10px; overflow: hidden; }
.scan-video-container video { width: 100%; height: auto; display: block; }
.scan-overlay { position: absolute; inset: 0; pointer-events: none; display: grid; place-items: center; }
.scan-frame { width: 80%; max-width: 560px; aspect-ratio: 16/9; border: 2px solid rgba(255,255,255,.6); position: relative; }
.scan-line { position: absolute; inset-inline: 0; top: 10%; height: 2px; background: rgba(0,255,0,.8); animation: scan-move 2.2s linear infinite; }
@keyframes scan-move { 0% { top: 10%; } 100% { top: 90%; } }

.loading { padding: 40px 0; text-align: center; color: var(--modern-text-secondary); }
</style>
