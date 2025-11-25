<template>
  <div class="section ccb-page">
    <h1 class="page-title">游戏查分</h1>

    <div class="ccb-container" v-if="!store.loading">
      <!-- 卡片管理 -->
      <div class="ccb-section">
        <h2 class="ccb-title">卡片管理</h2>

        <div class="ccb-card-selector">
          <button
              v-for="slot in [1,2,3]"
              :key="slot"
              class="ccb-card-btn"
              :class="{ active: store.activeSlot===slot, unbound: !store.isSlotBound(slot) }"
              @click="onSelectSlot(slot)"
          >
            <div class="line1">
              <span>卡片{{ slot }}</span>
              <i v-if="store.activeSlot===slot" class="fas fa-star star"></i>
            </div>
            <div class="line2">
              <template v-if="store.isSlotBound(slot)">
                <span class="ok"><i class="fas fa-check-circle"></i> 已绑定</span>
              </template>
              <template v-else>
                <span class="warn"><i class="fas fa-exclamation-circle"></i> 未绑定</span>
              </template>
            </div>
          </button>
        </div>

        <div class="ccb-card-toolbar">
          <button class="ccb-btn ccb-btn-secondary small" @click="unbindAll">全部解绑</button>
          <button
              class="ccb-btn ccb-btn-secondary small"
              :disabled="!store.isSlotBound(store.activeSlot)"
              @click="switchActive"
              v-if="store.isSlotBound(store.activeSlot)"
          >
            <i class="fas fa-exchange-alt"></i> 设为主查分卡片
          </button>
        </div>
      </div>

      <!-- 未绑定：绑定表单 -->
      <div v-if="!store.isSlotBound(store.activeSlot)" class="ccb-section">
        <h2 class="ccb-title">绑定卡片{{ store.activeSlot }}</h2>

        <form class="ccb-form" @submit.prevent="submitBind">
          <div class="form-group">
            <label for="server">服务器</label>
            <select id="server" v-model="form.server" required>
              <option value="">请选择服务器</option>
              <option v-for="s in store.servers" :key="s.server_url" :value="s.server_url">
                {{ s.server_name }}
              </option>
            </select>
          </div>

          <div class="form-group">
            <label>游戏卡号 (20位纯数字)</label>
            <div class="guid-input-container">
              <input
                  v-model="form.guid"
                  @input="form.guid = store.normalizeGuid(form.guid)"
                  maxlength="20" required placeholder="请输入20位游戏卡号"/>
              <button type="button" class="scan-btn" @click="openScan">
                <i class="fas fa-camera"></i><span>扫码输入</span>
              </button>
            </div>
            <small class="hint">仅限输入20位纯数字，或点击扫码按钮识别卡片</small>
          </div>

          <div class="form-group">
            <label>KeyChip (11位英数字)</label>
            <input
                v-model="form.keychip"
                @input="form.keychip = store.normalizeKeychip(form.keychip)"
                maxlength="11" required placeholder="请输入KeyChip (格式: AXXXXXXXXXX)"/>
            <small class="hint">格式: AXXXXXXXXXX (11位英数字), 如复制的是15位格式会自动转换</small>
            <div class="checkbox-group">
              <input type="checkbox" id="default-keychip" v-model="useDefaultKeychip">
              <label for="default-keychip">使用默认KeyChip</label>
            </div>
          </div>

          <div class="ccb-actions">
            <button class="ccb-btn ccb-btn-primary" :disabled="store.loading || bindBusy">
              {{ bindBusy ? '绑定中...' : `绑定卡片${store.activeSlot}` }}
            </button>
          </div>
        </form>
      </div>

      <!-- 已绑定：查询分数 -->
      <div v-else class="ccb-section">
        <h2 class="ccb-title">查询分数</h2>
        <p>当前使用：<strong>卡片{{ store.activeSlot }}</strong> | 服务器：<strong>{{ store.currentServerName }}</strong></p>

        <form class="ccb-form" @submit.prevent="submitQuery">
          <div class="form-group">
            <label for="game">选择游戏</label>
            <select id="game" v-model="selectedGame" required>
              <option value="">请选择游戏</option>
              <option v-for="g in store.games" :key="g.game_title" :value="g.game_title">
                {{ g.game_name }}
              </option>
            </select>
          </div>

          <div class="ccb-notice">
            <h4 class="ccb-notice-title"><i class="fas fa-exclamation-circle"></i>&ensp;提示</h4>
            <p class="ccb-notice-content">
              每次查分将消耗<b>1点普通积分</b>，查询结果以图片形式展示。<br>
              每次查分后需要等待10秒后才能再次查询。<br><br>
              保存图片按钮在移动端某些浏览器可能无效。如无效请长按图片保存到相册。
            </p>
          </div>

          <div class="ccb-actions">
            <button id="query-btn" class="ccb-btn ccb-btn-primary"
                    :disabled="store.querying || store.cooldownLeft>0">
              {{ store.querying ? '查询中...' : '查分' }}
            </button>
            <button type="button" class="ccb-btn ccb-btn-secondary" @click="unbindCurrent">解绑当前卡片</button>
          </div>

          <div class="ccb-points-info">
            当前积分：<span>{{ store.points }}</span>
            <button type="button" class="refresh-points-btn" @click="store.refreshPoints">
              <i class="fas fa-redo"></i> 刷新积分
            </button>
            <span v-if="refreshOK" class="refresh-ok">刷新成功</span>
          </div>

          <div v-if="store.cooldownLeft>0" class="ccb-cooldown">
            {{ store.cooldownLeft }} 秒后可再次查分
          </div>
        </form>

        <div class="ccb-section">
          <h2 class="ccb-title">查询结果</h2>
          <div class="ccb-result">
            <template v-if="store.lastImageDataUrl">
              <div class="ccb-result-container">
                <img :src="store.lastImageDataUrl" alt="查分结果">
                <div class="ccb-save-action">
                  <button class="ccb-btn ccb-btn-primary" @click="saveImage">保存图片</button>
                </div>
              </div>
            </template>
            <template v-else>
              <div class="empty">暂无结果</div>
            </template>
          </div>
        </div>
      </div>
    </div>

    <div v-else class="loading">加载中...</div>

    <!-- 扫码弹窗 -->
    <div v-if="scanOpen" class="scan-modal">
      <div class="scan-modal-content">
        <div class="scan-modal-header">
          <h2 class="scan-modal-title"><i class="fas fa-camera"></i> 扫描卡片</h2>
          <button class="scan-modal-close" @click="closeScan">×</button>
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
      </div>
    </div>
  </div>
</template>

<script setup>
import { onMounted, reactive, ref, watch, onBeforeUnmount } from 'vue';
import { useCcbStore } from '@/stores/ccb';

const store = useCcbStore();

const form = reactive({
  server: '',
  guid: '',
  keychip: '',
});
const useDefaultKeychip = ref(false);
watch(useDefaultKeychip, (v) => {
  form.keychip = v ? 'A63E01A8888' : '';
});

// 服务器/槽位变化时自动预选绑定服务器
watch([() => store.servers, () => store.activeSlot, () => store.bindings],
    () => {
      const b = store.currentBinding;
      if (b?.game_server) form.server = b.game_server;
    },
    { immediate: true, deep: true }
);

const bindBusy = ref(false);
const selectedGame = ref('');
const refreshOK = ref(false);

onMounted(async () => {
  await store.bootstrap();
});

function onSelectSlot(slot) {
  store.setActiveSlot(slot);
}

async function switchActive() {
  await store.switchActive(store.activeSlot);
}

async function unbindAll() {
  await store.unbindAll();
}

async function unbindCurrent() {
  await store.unbindSlot(store.activeSlot);
}

async function submitBind() {
  if (!form.server || !form.guid || !form.keychip) return;
  bindBusy.value = true;
  try {
    await store.bindCard({
      slot: store.activeSlot,
      game_server: form.server,
      keychip: store.normalizeKeychip(form.keychip),
      guid: store.normalizeGuid(form.guid),
    });
  } finally {
    bindBusy.value = false;
  }
}

async function submitQuery() {
  await store.queryScore(selectedGame.value);
  refreshOK.value = true;
  setTimeout(() => (refreshOK.value = false), 2000);
}

function saveImage() {
  const link = document.createElement('a');
  const ts = new Date().toISOString().replace(/[:.]/g, '-');
  link.href = store.lastImageDataUrl;
  link.download = `ccb_card${store.activeSlot}_${ts}.png`;
  document.body.appendChild(link);
  link.click();
  document.body.removeChild(link);
}

/** —— 扫码（优先条码，回退 OCR） —— */
const scanOpen = ref(false);
const videoEl = ref(null);
let stream = null;
let scanTimer = null;

function openScan() {
  scanOpen.value = true;
  startScan();
}
function closeScan() {
  scanOpen.value = false;
  stopScan();
}

async function startScan() {
  try {
    stream = await navigator.mediaDevices.getUserMedia({
      video: { facingMode: 'environment', width: { ideal: 1920 }, height: { ideal: 1080 } }
    });
    if (videoEl.value) {
      videoEl.value.srcObject = stream;
      videoEl.value.onloadedmetadata = () => { videoEl.value.play(); };
    }

    // 优先使用 BarcodeDetector
    let detector = null;
    if ('BarcodeDetector' in window) {
      try {
        detector = new window.BarcodeDetector({ formats: ['code_128', 'code_39', 'ean_13', 'qr_code'] });
      } catch { detector = null; }
    }
    const useDetector = !!detector;

    const Tesseract = useDetector ? null : await ensureTesseract();

    scanTimer = setInterval(async () => {
      if (!videoEl.value) return;
      const canvas = document.createElement('canvas');
      canvas.width = videoEl.value.videoWidth;
      canvas.height = videoEl.value.videoHeight;
      const ctx = canvas.getContext('2d');
      ctx.drawImage(videoEl.value, 0, 0);

      if (useDetector) {
        try {
          const bitmap = await createImageBitmap(canvas);
          const codes = await detector.detect(bitmap);
          bitmap.close();
          if (codes && codes.length) {
            const raw = (codes[0].rawValue || '').toString();
            const code = extractAccessCode(raw);
            if (code) {
              form.guid = store.normalizeGuid(code);
              closeScan();
            }
          }
        } catch {}
      } else if (Tesseract) {
        try {
          const blob = await new Promise(r => canvas.toBlob(r, 'image/png'));
          if (!blob) return;
          const { data: { text } } = await Tesseract.recognize(blob, 'eng', { logger: () => {} });
          const code = extractAccessCode(text);
          if (code) {
            form.guid = store.normalizeGuid(code);
            closeScan();
          }
        } catch {}
      }
    }, 900);
  } catch (e) {
    stopScan();
    alert('无法访问摄像头，请检查权限设置或使用手动输入');
  }
}

function stopScan() {
  if (scanTimer) { clearInterval(scanTimer); scanTimer = null; }
  if (stream) { stream.getTracks().forEach(t => t.stop()); stream = null; }
}
onBeforeUnmount(stopScan);

async function ensureTesseract() {
  if (window.Tesseract) return window.Tesseract;
  await new Promise((resolve, reject) => {
    const s = document.createElement('script');
    s.src = 'https://cdn.jsdelivr.net/npm/tesseract.js@5/dist/tesseract.min.js';
    s.onload = resolve; s.onerror = reject;
    document.head.appendChild(s);
  });
  return window.Tesseract;
}

// 参考原模块：优先提取 20 位数字，容错空格/破折号/分组
function extractAccessCode(text) {
  if (!text) return null;
  const unified = String(text).replace(/[\s\r\n-]/g, '');
  const direct = unified.match(/(\d{20})/);
  if (direct) return direct[1];
  // 遍历所有数字组合找 20 连续位
  const digits = unified.replace(/\D/g, '');
  if (digits.length >= 20) {
    for (let i = 0; i <= digits.length - 20; i++) {
      const cand = digits.slice(i, i + 20);
      if (!/^(\d)\1{19}$/.test(cand)) return cand; // 排除 20 位同号的极端误识别
    }
  }
  return null;
}
</script>

<style scoped>
/* —— 页面骨架 —— */
.ccb-container { display: grid; gap: 20px; }
.ccb-section { background: var(--surface, #fff); border: 1px solid var(--modern-border-color, #e5e7eb); border-radius: 12px; padding: 20px; }
.ccb-title { font-size: 18px; margin: 0 0 12px; }

/* —— 卡片管理 —— */
.ccb-card-selector { display: grid; grid-template-columns: repeat(3, 1fr); gap: 12px; }
.ccb-card-btn { border: 1px solid var(--modern-border-color, #e5e7eb); border-radius: 10px; padding: 12px; text-align: left; background: #fafafa; cursor: pointer; }
.ccb-card-btn.active { border-color: #2563eb; box-shadow: 0 0 0 2px rgba(37,99,235,.15); background: #f8fbff; }
.ccb-card-btn.unbound { opacity: .85; }
.ccb-card-btn .line1 { display: flex; align-items: center; justify-content: space-between; font-weight: 600; margin-bottom: 6px; }
.ccb-card-btn .star { color: gold; }
.ccb-card-btn .line2 .ok { color: #16a34a; font-size: 13px; }
.ccb-card-btn .line2 .warn { color: #ef4444; font-size: 13px; }

.ccb-card-toolbar { display: flex; gap: 8px; margin-top: 8px; }

/* —— 表单 —— */
.ccb-form { display: grid; gap: 16px; }
.form-group label { display:block; font-weight: 600; margin-bottom: 6px; }
.form-group input, .form-group select {
  width: 100%; height: 40px; border: 1px solid #e5e7eb; border-radius: 8px; padding: 0 12px; outline: none;
}
.form-group input:focus, .form-group select:focus { border-color: #2563eb; box-shadow: 0 0 0 3px rgba(37,99,235,.15); }
.guid-input-container { display: flex; gap: 8px; }
.scan-btn { display: inline-flex; align-items: center; gap: 6px; height: 40px; padding: 0 12px; border-radius: 8px; border: 1px solid #e5e7eb; background: #fff; cursor: pointer; }
.checkbox-group { display: flex; align-items: center; gap: 8px; margin-top: 6px; }
.hint { color: #6b7280; margin-top: 4px; display: block; }

/* —— 修复“默认KeyChip”checkbox 变巨大 —— */
.checkbox-group input[type="checkbox"] {
  width: auto;
  height: auto;
  inline-size: auto;
  block-size: auto;
  transform: none;
  appearance: auto;
  margin: 0 6px 0 0;
}
.checkbox-group label { display: inline-flex; align-items: center; gap: 6px; }

/* —— 操作按钮 —— */
.ccb-actions { display: flex; gap: 10px; flex-wrap: wrap; }
.ccb-btn { border: none; border-radius: 8px; height: 40px; padding: 0 16px; cursor: pointer; }
.ccb-btn-primary { background: #2563eb; color: #fff; }
.ccb-btn-primary:disabled { opacity: .6; cursor: not-allowed; }
.ccb-btn-secondary { background: #f3f4f6; color: #111827; }
.small { height: 34px; font-size: 13px; }

/* —— 提示/积分/冷却 —— */
.ccb-notice { background: #f8fafc; border: 1px solid #e5e7eb; border-radius: 10px; padding: 12px; }
.ccb-notice-title { margin: 0 0 6px; font-weight: 700; }
.ccb-notice-content { color: #334155; }
.ccb-points-info { display: flex; align-items: center; gap: 10px; margin-top: 8px; }
.refresh-points-btn { height: 28px; padding: 0 10px; border: 1px solid #e5e7eb; border-radius: 6px; background: #fff; cursor: pointer; }
.refresh-ok { color: #ef4444; font-weight: 600; }
.ccb-cooldown { margin-top: 8px; color: #ef4444; font-weight: 600; }

/* —— 结果 —— */
.ccb-result .empty { color: #6b7280; font-size: 14px; }
.ccb-result-container { display: grid; justify-items: center; gap: 12px; }
.ccb-result-container img { max-width: 100%; border: 1px solid #e5e7eb; border-radius: 10px; }

/* —— 扫码弹窗 —— */
.scan-modal {
  position: fixed; inset: 0; background: rgba(0,0,0,.6);
  display: grid; place-items: center; z-index: 9999;
}
.scan-modal-content {
  width: min(720px, 92vw); background: #fff; border-radius: 12px; padding: 16px;
  display: grid; gap: 12px;
}
.scan-modal-header { display: flex; align-items: center; justify-content: space-between; }
.scan-modal-title { margin: 0; font-size: 18px; }
.scan-modal-close { background: transparent; border: none; font-size: 20px; cursor: pointer; }

.scan-tips { background: #f8fafc; border: 1px solid #e5e7eb; border-radius: 10px; padding: 10px; }
.scan-tips-title { font-weight: 700; margin-bottom: 6px; }
.scan-tips-list { margin: 0; padding-left: 18px; color: #334155; }

.scan-video-container { position: relative; background: #000; border-radius: 10px; overflow: hidden; }
.scan-video-container video { width: 100%; height: auto; display: block; }
.scan-overlay { position: absolute; inset: 0; pointer-events: none; display: grid; place-items: center; }
.scan-frame { width: 80%; max-width: 560px; aspect-ratio: 16/9; border: 2px solid rgba(255,255,255,.6); position: relative; }
.scan-line { position: absolute; inset-inline: 0; top: 10%; height: 2px; background: rgba(0,255,0,.8); animation: scan-move 2.2s linear infinite; }
@keyframes scan-move { 0% { top: 10%; } 100% { top: 90%; } }

/* —— 杂项 —— */
.loading { padding: 40px 0; text-align: center; color: #6b7280; }
</style>
