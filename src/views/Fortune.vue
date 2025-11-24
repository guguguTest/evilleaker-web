<template>
  <div class="fortune-container">
    <section class="fortune-section">
      <div class="song-cover">
        <!-- 封面图 -->
        <img
            v-if="coverVisible"
            id="cover-img"
            :src="coverUrl"
            alt="cover"
        />

        <!-- 抽签动画（签筒） -->
        <div class="fortune-animation" v-show="animating">
          <img id="kuji-01" class="kuji-img" :class="{ 'kuji-swing': animSwing }" src="https://oss.am-all.com.cn/asset/img/main/common/kuji-01.png" alt="kuji-01"/>
          <img id="kuji-02" class="kuji-img" :class="{ 'kuji-fadein': animFadeIn }" src="https://oss.am-all.com.cn/asset/img/main/common/kuji-02.png" alt="kuji-02"/>
        </div>
      </div>

      <div class="song-info">
        <div class="song-id-cat">
          <span id="song-id" class="song-id">{{ displaySong.id || '???' }}</span>
          <span id="song-category" class="song-category" :class="categoryClass">{{ categoryText }}</span>
        </div>

        <h2 id="song-title" class="song-title">{{ displaySong.title || '???' }}</h2>
        <p id="song-artist" class="song-artist">{{ displaySong.artist || '???' }}</p>

        <div class="difficulties">
          <!-- World's End -->
          <div v-if="isWorldsEnd && !isDummy" class="difficulty-tag lev-we">
            <span>World's End: {{ displaySong.we_kanji }}</span>
            <span v-if="starCount > 0" class="we-stars">
              <i v-for="n in starDisplayCount" :key="n" class="fas fa-star star"></i>
            </span>
          </div>
          <!-- 普通难度 -->
          <div v-else v-for="d in visibleDiffs" :key="d.level" class="difficulty-tag" :class="'lev-' + d.level" :data-level="d.label">
            <span>{{ d.value }}</span>
          </div>
        </div>

        <!-- 吉凶 -->
        <div class="fortune-luck-container">
          <div class="fortune-luck-label">今日运势</div>
          <div id="fortune-luck" class="fortune-luck-value">{{ currentLuck }}</div>
        </div>

        <!-- 宜不宜 -->
        <div class="fortune-recommendation">
          <div class="recommend-item">
            <span class="recommend-label">宜</span>
            <span id="lucky-action">{{ currentRecom.lucky }}</span>
          </div>
          <div class="recommend-item">
            <span class="recommend-label">不宜</span>
            <span id="unlucky-action">{{ currentRecom.unlucky }}</span>
          </div>
        </div>
      </div>

      <button
          id="draw-btn"
          class="fortune-btn"
          :disabled="!canDraw || animating"
          @click="handleDraw"
      >
        <i v-if="animating" class="fas fa-spinner fa-spin me-2" />
        <template v-else>
          <i class="fas fa-star me-2" /> 抽取今日运势
        </template>
      </button>

      <p id="fortune-hint" class="fortune-hint">{{ hintText }}</p>
    </section>
  </div>
</template>

<script setup>
import {onMounted, onBeforeUnmount, ref, computed} from 'vue';
import {useAuthStore} from '@/stores/auth';
import {useFortuneStore} from '@/stores/fortune';
import {getLastDraw, drawFortune} from '@/api/fortune';

// —— 常量 ——
const MUSIC_DATA_URLS = [
  'https://oss.am-all.com.cn/asset/img/main/data/music.json',
];
const DUMMY = {
  id: '???', title: '???', artist: '???', catname: '???',
  lev_bas: '?', lev_adv: '?', lev_exp: '?', lev_mas: '?', lev_ult: '?'
};

// —— 本地状态 ——
const auth = useAuthStore();
const fortune = useFortuneStore();
const loading = ref(true);
const errorMsg = ref('');
const coverVisible = ref(true);
const animating = ref(false);
const animSwing = ref(false);
const animFadeIn = ref(false);
let scrollTimer = null;
let songList = [];

// —— 计算属性（只读） ——
const displaySong = computed(() => fortune.song || DUMMY);
const currentLuck = computed(() => fortune.luck);
const currentRecom = computed(() => fortune.recommendations);
const canDraw = computed(() => fortune.canDraw);

const isDummy = computed(() => (displaySong.value.id === '???'));
const isWorldsEnd = computed(() => !!(displaySong.value.we_kanji || displaySong.value.we_star));
const starCount = computed(() => parseInt(displaySong.value.we_star || 0));
const starDisplayCount = computed(() => Math.ceil(Math.max(0, starCount.value) / 2));
const categoryClass = computed(() => {
  const map = {
    'POPS & ANIME': 'cat-pops',
    'niconico': 'cat-nico',
    '東方Project': 'cat-touhou',
    'VARIETY': 'cat-variety',
    'イロドリミドリ': 'cat-irodori',
    'ゲキマイ': 'cat-gekimai',
    'ORIGINAL': 'cat-original'
  };
  return isDummy.value ? 'cat-dummy' : (map[displaySong.value.catname] || '');
});
const categoryText = computed(() => isDummy.value ? '???' : (displaySong.value.catname || '???'));
const visibleDiffs = computed(() => {
  const s = displaySong.value;
  return [
    { level: 'bas', label: 'BASIC',  value: isDummy.value ? '?' : s.lev_bas },
    { level: 'adv', label: 'ADVANCE', value: isDummy.value ? '?' : s.lev_adv },
    { level: 'exp', label: 'EXPERT',  value: isDummy.value ? '?' : s.lev_exp },
    { level: 'mas', label: 'MASTER',  value: isDummy.value ? '?' : s.lev_mas },
    { level: 'ult', label: 'ULTIMA',  value: isDummy.value ? '?' : s.lev_ult },
  ].filter(d => d.value || isDummy.value);
});
const coverUrl = computed(() => {
  const img = displaySong.value?.image ? displaySong.value.image : 'dummy.jpg';
  return `https://oss.am-all.com.cn/asset/img/main/music/${img}`;
});
const hintText = computed(() => {
  if (errorMsg.value) return errorMsg.value;
  if (loading.value) return '正在加载...';
  if (animating.value) return '';

  if (canDraw.value) return '今日运势待抽取';

  // 已抽取场景：根据 nextDrawTime 显示剩余时间
  if (fortune.nextDrawTime) {
    const next = new Date(fortune.nextDrawTime);
    const now = new Date();
    const hoursLeft = Math.max(0, Math.ceil((next - now) / (1000 * 60 * 60)));
    return `今日运势已抽取，${hoursLeft}小时后可再次抽取`;
  }
  return '今日运势已抽取，请明天再来';
});

// —— 方法 ——
function setDisplay(song, luck, recom) {
  fortune.setSong(song || DUMMY);
  fortune.setLuck(luck);
  fortune.setRecommendations(recom);
}

async function loadMusicData() {
  for (const url of MUSIC_DATA_URLS) {
    try {
      const res = await fetch(url);
      if (!res.ok) continue;
      const data = await res.json();
      if (Array.isArray(data)) songList = data; else if (data?.songs) songList = data.songs; else continue;
      return;
    } catch (e) {
      // ignore and try next url
    }
  }
  songList = [{...DUMMY, id: '001', title: '备用歌曲', artist: '系统', catname: 'ORIGINAL', lev_bas: '3', lev_adv: '5', lev_exp: '7', lev_mas: '9', lev_ult: '12', image: 'dummy.jpg'}];
}

async function refreshStatus() {
  if (!auth.token) {
    loading.value = false;
    errorMsg.value = '请先登录';
    fortune.setStatus({ can: false, nextTime: null });
    setDisplay(DUMMY, '???', {lucky: '?', unlucky: '?'});
    return;
  }
  try {
    const data = await getLastDraw();
    // data: { canDraw, lastFortune?, nextDrawTime? }
    if (data.canDraw) {
      fortune.setStatus({ can: true, nextTime: null });
      setDisplay(DUMMY, '???', {lucky: '?', unlucky: '?'});
    } else {
      fortune.setStatus({ can: false, nextTime: data.nextDrawTime || null });
      if (data.lastFortune) {
        let songData = data.lastFortune.song_data;
        try { if (typeof songData === 'string') songData = JSON.parse(songData); } catch {}
        let recom = data.lastFortune.recommendations;
        try { if (typeof recom === 'string') recom = JSON.parse(recom); } catch {}
        setDisplay(songData, data.lastFortune.luck, recom);
      } else {
        setDisplay(DUMMY, '???', {lucky: '?', unlucky: '?'});
      }
    }
  } catch (e) {
    errorMsg.value = '无法获取抽取状态，请稍后重试';
    setDisplay(DUMMY, '???', {lucky: '?', unlucky: '?'});
  } finally {
    loading.value = false;
  }
}

function startAnimation() {
  coverVisible.value = false;
  animating.value = true;
  animSwing.value = true;
  animFadeIn.value = false;

  // 滚动 30 次后触发抽取
  let count = 0;
  scrollTimer = setInterval(() => {
    const temp = songList.length ? songList[Math.floor(Math.random() * songList.length)] : DUMMY;
    setDisplay(temp, '???', {lucky: '?', unlucky: '?'});
    if (++count > 30) {
      stopAnimation();
      doDraw();
    }
  }, 100);
}

function stopAnimation() {
  if (scrollTimer) clearInterval(scrollTimer);
  animSwing.value = false;
  animFadeIn.value = false;
}

async function doDraw() {
  try {
    const data = await drawFortune();
    if (data?.success) {
      setDisplay(data.song, data.luck, data.recommendations);
      // 成功信息（若返回积分）
      if (data.pointsEarned) {
        errorMsg.value = `恭喜获得 ${data.pointsEarned} 积分！当前积分: ${(data.points || 0) + (data.point2 || 0)}`;
      } else {
        errorMsg.value = '';
      }
      fortune.setStatus({ can: false, nextTime: null });
    } else {
      errorMsg.value = data?.error || '抽取运势失败';
    }
  } catch (e) {
    errorMsg.value = e?.message || '网络错误，请重试';
  } finally {
    animating.value = false;
    coverVisible.value = true;
  }
}

async function handleDraw() {
  if (!auth.token) {
    errorMsg.value = '请先登录';
    return;
  }
  startAnimation();
}

onMounted(async () => {
  loading.value = true;
  await loadMusicData();
  await refreshStatus();
});

onBeforeUnmount(() => {
  stopAnimation();
});
</script>

<style scoped>
.fortune-container {
  position: relative;   /* 建立层叠上下文 */
  z-index: 0;           /* 使 ::before 能置于其下 */
  width: 100%;
  min-height: 100vh;    /* 兼容旧浏览器 */
  min-height: 100dvh;   /* 动态视口，避免系统栏影响 */
  display: grid;        /* 网格居中 */
  place-items: center;  /* 水平+垂直居中 */
  padding: 40px 20px;   /* 小屏保留可用空间 */
  overflow: hidden;     /* 裁剪溢出（防抖动） */
  isolation: isolate;   /* 新建层叠上下文，避免 -1 背景出层 */
  background: transparent;
}

.fortune-container::before {
  content: "";
  position: fixed;  /* 相对视口固定，不随内容高度变化 */
  inset: 0;         /* 顶/右/底/左全贴合 */
  background-image: url('https://oss.am-all.com.cn/asset/img/main/common/fortune_bg.jpg');
  background-size: cover;           /* 铺满裁切 */
  background-position: center;      /* 居中对齐 */
  background-repeat: no-repeat;     /* 不平铺 */
  z-index: -1;                      /* 位于内容之下 */
  transform: translateZ(0);         /* GPU 合成，减少抖动 */
}

.fortune-section {
  max-width: 600px;
  width: 100%;
  margin: 0;         /* 由 Grid 负责居中 */
}

.song-cover {
  width: 300px;
  height: 300px;
  margin: 0 auto 20px;
  border-radius: 8px;
  overflow: hidden;
  box-shadow: 0 5px 15px rgba(0, 0, 0, 0.2);
  background-color: #f5f5f5;
  position: relative; /* 为动画容器提供定位上下文 */
}

.song-cover img { width: 100%; height: 100%; object-fit: cover; }

.song-info { text-align: center; margin-bottom: 30px; }

.song-id-cat { display: flex; justify-content: center; gap: 15px; margin-bottom: 15px; flex-wrap: wrap; }
.song-id { background: #2c3e50; color: #fff; padding: 5px 15px; border-radius: 20px; font-weight: 500; }
.song-category { color: #fff; padding: 5px 15px; border-radius: 20px; font-weight: 500; }
.cat-pops { background-color: #e74c3c; }
.cat-nico { background-color: #9b59b6; }
.cat-touhou { background-color: #3498db; }
.cat-variety { background-color: #2ecc71; }
.cat-irodori { background-color: #e84393; }
.cat-gekimai { background-color: #f39c12; }
.cat-original { background-color: #d35400; }
.cat-dummy { background-color: #2c3e50; color: #fff; }

.song-title { font-size: 1.8rem; font-weight: 700; margin-bottom: 10px; color: #2c3e50; }
.song-artist { font-size: 1.1rem; color: #7f8c8d; margin-bottom: 20px; }

.difficulties { display: flex; justify-content: center; gap: 10px; flex-wrap: wrap; }

.difficulty-tag { padding: 5px 12px; border-radius: 4px; color: #fff; font-weight: 500; }
.lev-bas { background-color: #27ae60; }
.lev-adv { background-color: #d35400; }
.lev-exp { background-color: #c0392b; }
.lev-mas { background-color: #8e44ad; }
.lev-ult { background-color: #2c3e50; }

/* WE 难度与星标 */
.lev-we {
  background: linear-gradient(90deg, #ff0000, #ff7f00, #ffff00, #00ff00, #0000ff, #4b0082, #9400d3);
  color: #fff;
  font-weight: bold;
  text-shadow: -1px -1px 0 #000, 1px -1px 0 #000, -1px 1px 0 #000, 1px 1px 0 #000;
  display: inline-flex; align-items: center; flex-wrap: wrap;
}
.we-stars { display: inline-flex; align-items: center; gap: 3px; background: #000; padding: 2px 5px; border-radius: 4px; margin-left: 5px; vertical-align: middle; }
.we-stars .star { color: #ffcc00; font-size: 0.9em; }

.fortune-btn { background: #3498db; color: #fff; border: none; padding: 12px 30px; border-radius: 6px; font-size: 1.1rem; font-weight: 500; cursor: pointer; transition: all 0.3s ease; display: block; margin: 0 auto; }
.fortune-btn:hover { background: #2980b9; transform: translateY(-2px); box-shadow: 0 4px 10px rgba(52,152,219,0.3); }
.fortune-btn:disabled { background: #95a5a6; cursor: not-allowed; transform: none; box-shadow: none; }

.fortune-hint { text-align: center; margin-top: 15px; color: #e74c3c; font-weight: 500; }

/* 抽签动画 */
.fortune-animation { position: absolute; top: 50%; left: 50%; transform: translate(-50%, -50%); z-index: 10; display: none; }
.kuji-img { width: auto; height: auto; max-width: none; }
.kuji-swing { animation: kuji-swing 0.8s ease-in-out infinite; }
.kuji-fadein { animation: kuji-fadein 0.5s ease-out forwards; }
@keyframes kuji-swing { 0%{transform:rotate(-5deg);}25%{transform:rotate(5deg);}50%{transform:rotate(-7deg);}75%{transform:rotate(7deg);}100%{transform:rotate(0);} }
@keyframes kuji-fadein { 0%{opacity:0;} 100%{opacity:1;} }

/* 吉凶显示 */
.fortune-luck-container { margin-top: 20px; padding: 12px; background: rgba(255,215,0,0.1); border-radius: 8px; display: flex; align-items: center; justify-content: center; gap: 10px; font-size: 1.2rem; font-weight: 500; flex-direction: column; text-align: center; }
.fortune-luck-label { color: #7f8c8d; font-size: 1.1rem; margin-bottom: 5px; }
.fortune-luck-value { color: #e74c3c; font-weight: bold; font-size: 1.8rem; line-height: 1.2; }

/* 响应式 */
@media (max-width: 768px) {
  .fortune-section { padding: 15px; }
  .fortune-container { padding: 24px 12px; }
  .song-cover { width: 190px; height: 190px; margin: 0 auto 10px; }
  .song-id-cat { gap: 8px; margin-bottom: 10px; }
  .song-id, .song-category { padding: 3px 10px; font-size: 0.9rem; }
  .song-title { font-size: 1.5rem; margin-bottom: 8px; }
  .song-artist { font-size: 1rem; margin-bottom: 15px; }
  .difficulty-tag { padding: 3px 8px; font-size: 0.9rem; margin-bottom: 5px; }
  .fortune-luck-container { padding: 8px; font-size: 1rem; margin-top: 15px; }
  .fortune-luck-value { font-size: 1.2rem; }
  .fortune-btn { padding: 10px 20px; font-size: 1rem; }
  .difficulty-tag:not(.lev-we) { width: 40px; height: 40px; padding: 0; border-radius: 50% !important; display: flex; align-items: center; justify-content: center; font-size: 1.1rem; font-weight: bold; }
  .lev-we { width: 100%; max-width: 250px; text-align: center; padding: 5px 10px; font-size: 0.9rem; border-radius: 20px; margin-top: 5px; }
  .we-stars { display: inline-flex; margin-left: 5px; }
}

/* PC 端难度标签前缀文字 */
@media (min-width: 769px) {
  .difficulty-tag:not(.lev-we)::before { content: attr(data-level) " "; font-size: 0.8em; }
  .lev-bas::before { content: "BASIC "; }
  .lev-adv::before { content: "ADVANCE "; }
  .lev-exp::before { content: "EXPERT "; }
  .lev-mas::before { content: "MASTER "; }
  .lev-ult::before { content: "ULTIMA "; }
}
</style>