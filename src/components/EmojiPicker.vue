<!-- src/components/EmojiPicker.vue -->
<script setup>
import { onMounted, ref } from 'vue'
import {
  getEmojiPacks,
  getEmojiItems,
  reportEmojiUsage,
  getRecentEmojis,
} from '@/api/emoji'
import { baseUrl } from '@/api/base'
import { joinUrl } from '@/utils/misc'

const emit = defineEmits(['select'])

const packs = ref([])
const activePackId = ref('recent')
const loading = ref(false)
const emojis = ref([])

/* ---------- 加载数据 ---------- */

async function loadPacks () {
  try {
    const res = await getEmojiPacks()
    packs.value = Array.isArray(res) ? res : []
  } catch (e) {
    console.error('getEmojiPacks error', e)
  }
}

async function loadItems (packId) {
  loading.value = true
  try {
    const res = await getEmojiItems(packId)
    emojis.value = Array.isArray(res) ? res : []
  } catch (e) {
    console.error('getEmojiItems error', e)
    emojis.value = []
  } finally {
    loading.value = false
  }
}

async function loadRecent () {
  loading.value = true
  try {
    const res = await getRecentEmojis()
    emojis.value = Array.isArray(res) ? res : []
  } catch (e) {
    console.error('getRecentEmojis error', e)
    emojis.value = []
  } finally {
    loading.value = false
  }
}

function switchPack (id) {
  activePackId.value = id
  if (id === 'recent') {
    loadRecent()
  } else {
    loadItems(id)
  }
}

function imgUrl (p) {
  return p?.startsWith('http') ? p : joinUrl(baseUrl, p)
}

/* ---------- 选择表情 ---------- */

async function onSelect (emoji) {
  try {
    emit('select', emoji)
    if (emoji?.id) {
      await reportEmojiUsage(emoji.id)
    }
  } catch (e) {
    // 忽略统计失败
  }
}

/* ---------- 初始化 ---------- */

onMounted(async () => {
  await loadPacks()
  await loadRecent()
})
</script>

<template>
  <div class="emoji-picker">
    <!-- 上面：表情网格区域（只这里上下滚动） -->
    <div class="emoji-grid-container">
      <div v-if="loading" class="emoji-loading">
        加载中…
      </div>
      <div v-else-if="!emojis.length" class="emoji-empty">
        暂无表情
      </div>
      <div v-else class="emoji-grid">
        <button
            v-for="e in emojis"
            :key="e.id || e.file_path"
            type="button"
            class="emoji-item"
            :title="e.emoji_name || e.file_name"
            @click="onSelect(e)"
        >
          <img
              :src="imgUrl(e.file_path)"
              :alt="e.emoji_name || e.file_name"
          />
          <span
              v-if="e.sound_path"
              class="emoji-audio-badge"
          >
            🔊
          </span>
        </button>
      </div>
    </div>

    <!-- 下面：表情分类栏（支持横向滑动，不参与纵向滚动） -->
    <div class="emoji-tabs">
      <!-- 最近使用 -->
      <button
          class="emoji-tab"
          :class="{ active: activePackId === 'recent' }"
          type="button"
          @click="switchPack('recent')"
          title="最近使用"
      >
        <i class="far fa-clock" />
      </button>

      <!-- 其它表情包 -->
      <button
          v-for="pack in packs"
          :key="pack.id"
          class="emoji-tab"
          :class="{ active: activePackId === pack.id }"
          type="button"
          :title="pack.pack_name"
          @click="switchPack(pack.id)"
      >
        <img
            v-if="pack.cover_image"
            :src="imgUrl(pack.cover_image)"
            :alt="pack.pack_name"
        />
        <i v-else class="far fa-smile" />
      </button>
    </div>
  </div>
</template>

<style scoped>
/* 稍微加宽一点，避免竖向滚动条挡住最右侧表情 */
.emoji-picker {
  width: 360px;
  max-height: 360px;
  display: flex;
  flex-direction: column;
}

/* 表情网格容器：不滚动，滚动交给里面的 .emoji-grid */
.emoji-grid-container {
  flex: 1 1 auto;
  overflow: hidden;
}

.emoji-loading,
.emoji-empty {
  height: 240px;
  display: flex;
  align-items: center;
  justify-content: center;
  color: #909399;
  gap: 6px;
}

/* 表情网格：6 列，只这里纵向滚动。
   右侧 padding 稍微大一点，给滚动条留空间，不压住第 6 列 */
.emoji-grid {
  padding: 10px 16px 10px 10px; /* 左 10 右 16 */
  display: grid;
  grid-template-columns: repeat(6, 1fr);
  gap: 8px;
  max-height: 300px;
  overflow-y: auto;
  overflow-x: hidden;
  box-sizing: border-box;
}

.emoji-item {
  width: 44px;
  height: 44px;
  border: 1px solid transparent;
  border-radius: 8px;
  display: flex;
  align-items: center;
  justify-content: center;
  background: #fff;
  cursor: pointer;
  position: relative;
}

.emoji-item:hover {
  border-color: #c6e2ff;
  background: #ecf5ff;
}

.emoji-item img {
  max-width: 36px;
  max-height: 36px;
  object-fit: contain;
}

.emoji-audio-badge {
  position: absolute;
  transform: translate(14px, -14px);
  font-size: 12px;
}

/* 分类栏：在下面，只横向滚动，隐藏滚动条，用鼠标/触摸拖动 */
.emoji-tabs {
  display: flex;
  gap: 6px;
  padding: 6px 8px 8px;
  border-top: 1px solid #ebeef5;
  overflow-x: auto;
  overflow-y: hidden;
  -webkit-overflow-scrolling: touch;
  scrollbar-width: none; /* Firefox 隐藏滚动条 */
}

/* 隐藏 WebKit 横向滚动条，只保留“拖动”行为 */
.emoji-tabs::-webkit-scrollbar {
  height: 0;
}

.emoji-tab {
  border: none;
  outline: none;
  background: transparent;
  border-radius: 6px;
  padding: 4px 6px;
  cursor: pointer;
  display: inline-flex;
  align-items: center;
  justify-content: center;
  flex: 0 0 auto; /* 不要被压缩，超出时可以横向滑动 */
}

.emoji-tab.active {
  background: #ecf5ff;
}

.emoji-tab img {
  width: 24px;
  height: 24px;
  object-fit: contain;
}
</style>
