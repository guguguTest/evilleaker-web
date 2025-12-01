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

onMounted(async () => {
  await loadPacks()
  await loadRecent()
})
</script>

<template>
  <div class="emoji-picker">
    <div class="emoji-tabs">
      <button
          class="emoji-tab"
          :class="{ active: activePackId === 'recent' }"
          type="button"
          @click="switchPack('recent')"
          title="最近使用"
      >
        <i class="far fa-clock" />
      </button>
      <button
          v-for="pack in packs"
          :key="pack.id"
          class="emoji-tab"
          :class="{ active: activePackId === pack.id }"
          type="button"
          :title="pack.pack_name"
          @click="switchPack(pack.id)"
      >
        <img v-if="pack.cover_image" :src="imgUrl(pack.cover_image)" :alt="pack.pack_name" />
        <i v-else class="far fa-smile" />
      </button>
    </div>

    <div class="emoji-grid-container">
      <div v-if="loading" class="emoji-loading">
        <el-icon class="is-loading"><Loading /></el-icon><span>加载中…</span>
      </div>
      <div v-else-if="!emojis.length" class="emoji-empty">暂无表情</div>
      <div v-else class="emoji-grid">
        <button
            v-for="e in emojis"
            :key="e.id"
            type="button"
            class="emoji-item"
            :title="e.emoji_name || e.file_name"
            @click="onSelect(e)"
        >
          <img :src="imgUrl(e.file_path)" :alt="e.emoji_name || e.file_name" />
          <span v-if="e.sound_path" class="emoji-audio-badge">🔊</span>
        </button>
      </div>
    </div>
  </div>
</template>

<style scoped>
.emoji-picker { width: 340px; max-height: 360px; display: flex; flex-direction: column; }
.emoji-tabs { display: flex; gap: 6px; padding: 8px; border-bottom: 1px solid #ebeef5; }
.emoji-tab {
  border: none; outline: none; background: transparent;
  border-radius: 6px; padding: 4px 6px; cursor: pointer;
  display: inline-flex; align-items: center; justify-content: center;
}
.emoji-tab.active { background: #ecf5ff; }
.emoji-tab img { width: 24px; height: 24px; object-fit: contain; }
.emoji-grid-container { flex: 1 1 auto; overflow: hidden; }
.emoji-loading, .emoji-empty {
  height: 240px; display: flex; align-items: center; justify-content: center; color: #909399; gap: 6px;
}
.emoji-grid {
  padding: 10px; display: grid; grid-template-columns: repeat(6, 1fr); gap: 8px;
  overflow: auto; max-height: 300px;
}
.emoji-item {
  width: 44px; height: 44px; border: 1px solid transparent; border-radius: 8px;
  display: flex; align-items: center; justify-content: center; background: #fff; cursor: pointer;
}
.emoji-item:hover { border-color: #c6e2ff; background: #ecf5ff; }
.emoji-item img { max-width: 36px; max-height: 36px; object-fit: contain; }
.emoji-audio-badge { position: absolute; transform: translate(14px, -14px); font-size: 12px; }
</style>
