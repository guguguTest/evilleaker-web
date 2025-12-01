<!-- src/components/EmojiPicker.vue -->
<script setup>
import { onMounted, ref } from 'vue';
import {
  getEmojiPacks,
  getEmojiItems,
  reportEmojiUsage,
  getRecentEmojis,
} from '@/api/emoji';
import { baseUrl } from '@/api/base';
import { joinUrl } from '@/utils/misc';

const emit = defineEmits(['select']);

const packs = ref([]);
const activePackId = ref('recent'); // 'recent' 或具体 pack.id
const emojis = ref([]);
const loading = ref(false);

function buildImgUrl(path) {
  if (!path) return '';
  return joinUrl(baseUrl, path);
}

async function loadPacks() {
  try {
    const res = await getEmojiPacks();
    packs.value = Array.isArray(res.data) ? res.data : [];
  } catch (e) {
    console.error('load emoji packs error', e);
  }
}

async function loadRecent() {
  loading.value = true;
  try {
    const res = await getRecentEmojis();
    emojis.value = Array.isArray(res.data) ? res.data : [];
  } catch (e) {
    console.error('load recent emojis error', e);
    emojis.value = [];
  } finally {
    loading.value = false;
  }
}

async function loadPackItems(packId) {
  loading.value = true;
  try {
    const res = await getEmojiItems(packId);
    emojis.value = Array.isArray(res.data) ? res.data : [];
  } catch (e) {
    console.error('load emoji items error', e);
    emojis.value = [];
  } finally {
    loading.value = false;
  }
}

async function switchPack(id) {
  if (activePackId.value === id) return;
  activePackId.value = id;
  if (id === 'recent') {
    await loadRecent();
  } else {
    await loadPackItems(id);
  }
}

async function handleSelect(emoji) {
  // 先上报使用
  try {
    if (emoji?.id) {
      await reportEmojiUsage(emoji.id);
    }
  } catch (e) {
    console.error('reportEmojiUsage error', e);
  }
  // 把完整 emoji 对象抛给父组件，由父组件决定如何编码成 [emoji:xxx]
  emit('select', emoji);
}

onMounted(async () => {
  await loadPacks();
  await loadRecent();
});
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
          @click="switchPack(pack.id)"
          :title="pack.pack_name"
      >
        <img
            v-if="pack.cover_image"
            class="emoji-pack-cover"
            :src="buildImgUrl(pack.cover_image)"
            :alt="pack.pack_name"
        />
        <span v-else class="emoji-pack-text">
          {{ pack.pack_name?.slice(0, 2) || '包' }}
        </span>
      </button>
    </div>

    <div class="emoji-grid-container">
      <div v-if="loading" class="emoji-loading">
        <i class="fas fa-spinner fa-spin" />
        <span>加载表情中...</span>
      </div>
      <div v-else-if="!emojis.length" class="emoji-empty">
        暂无表情
      </div>
      <div v-else class="emoji-grid">
        <button
            v-for="emoji in emojis"
            :key="emoji.id"
            type="button"
            class="emoji-item"
            @click="handleSelect(emoji)"
        >
          <img
              class="emoji-img"
              :src="buildImgUrl(emoji.file_path)"
              :alt="emoji.emoji_name || emoji.file_name"
          />
        </button>
      </div>
    </div>
  </div>
</template>

<style scoped>
.emoji-picker {
  display: flex;
  flex-direction: column;
  width: 100%;
  max-height: 320px;
}

.emoji-tabs {
  display: flex;
  padding: 4px;
  border-bottom: 1px solid #ebeef5;
  gap: 4px;
  overflow-x: auto;
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
}

.emoji-tab.active {
  background: #ecf5ff;
  color: #409eff;
}

.emoji-pack-cover {
  width: 24px;
  height: 24px;
  border-radius: 4px;
  object-fit: cover;
}

.emoji-pack-text {
  font-size: 12px;
  color: #606266;
}

.emoji-grid-container {
  flex: 1;
  overflow: auto;
  padding: 6px;
}

.emoji-loading,
.emoji-empty {
  height: 180px;
  display: flex;
  flex-direction: column;
  align-items: center;
  justify-content: center;
  color: #909399;
  font-size: 13px;
  gap: 6px;
}

.emoji-grid {
  display: grid;
  grid-template-columns: repeat(auto-fill, minmax(36px, 1fr));
  gap: 4px;
}

.emoji-item {
  border: none;
  outline: none;
  padding: 4px;
  background: transparent;
  border-radius: 6px;
  cursor: pointer;
  display: flex;
  align-items: center;
  justify-content: center;
}

.emoji-item:hover {
  background: #f5f7fa;
}

.emoji-img {
  max-width: 100%;
  max-height: 100%;
}
</style>
