<!-- src/components/EmojiPicker.vue -->
<script setup>
import {onMounted, ref} from 'vue';
import {getEmojiPacks, getEmojiItems, reportEmojiUsage, getRecentEmojis} from '@/api/emoji';
import {baseUrl} from '@/api/base';
import {joinUrl} from '@/utils/misc';

const emit = defineEmits(['select']);

const open = ref(false);
const packs = ref([]);
const activePackId = ref('recent'); // 'recent' or pack.id
const emojis = ref([]);
const loading = ref(false);

async function loadPacks() {
  const res = await getEmojiPacks();
  packs.value = res;
  if (!packs.value.find(p => p.id === activePackId.value)) {
    activePackId.value = 'recent';
  }
}

async function loadRecent() {
  const res = await getRecentEmojis();
  emojis.value = res;
}

async function loadPackItems(packId) {
  loading.value = true;
  try {
    if (packId === 'recent') {
      await loadRecent();
    } else {
      const res = await getEmojiItems(packId);
      emojis.value = res;
    }
  } finally {
    loading.value = false;
  }
}

function toggle() {
  open.value = !open.value;
}

async function selectEmoji(emoji) {
  emit('select', {
    id: emoji.id,
    text: emoji.shortcode || emoji.emoji_name || '',
  });

  // 上报使用
  try { await reportEmojiUsage(emoji.id); } catch (_) {}
  open.value = false;
}

onMounted(async () => {
  await loadPacks();
  await loadPackItems(activePackId.value);
});
</script>

<template>
  <div class="emoji-picker">
    <button class="emoji-picker-btn" type="button" @click.stop="toggle" title="表情">
      <i class="far fa-smile"></i>
    </button>

    <div v-if="open" class="emoji-dropdown" @click.stop>
      <div class="emoji-tabs">
        <button
            class="emoji-tab"
            :class="{ active: activePackId === 'recent' }"
            @click="activePackId = 'recent'; loadPackItems('recent')"
        >
          最近
        </button>
        <button
            v-for="pack in packs"
            :key="pack.id"
            class="emoji-tab"
            :class="{ active: activePackId === pack.id }"
            @click="activePackId = pack.id; loadPackItems(pack.id)"
        >
          {{ pack.pack_name }}
        </button>
      </div>

      <div class="emoji-list">
        <div v-if="loading" class="emoji-loading">
          <i class="fas fa-spinner fa-spin"></i>
        </div>
        <template v-else>
          <button
              v-for="emoji in emojis"
              :key="emoji.id"
              class="emoji-item"
              type="button"
              @click="selectEmoji(emoji)"
          >
            <img
                v-if="emoji.file_path"
                class="emoji-img"
                :src="joinUrl(baseUrl, emoji.file_path)"
                :alt="emoji.emoji_name"
            />
            <span v-else>{{ emoji.shortcode || '😀' }}</span>
          </button>
        </template>
      </div>
    </div>
  </div>
</template>

<style scoped>
/* 关键样式来自 emoji.css */

.emoji-picker {
  position: relative;
  display: inline-block;
}

.emoji-picker-btn {
  border: none;
  background: transparent;
  cursor: pointer;
  color: #6b7280;
  font-size: 18px;
}

.emoji-dropdown {
  position: absolute;
  bottom: 44px;  /* 贴输入框上方 */
  right: 0;
  width: 260px;
  max-height: 210px;
  background: #fff;
  border-radius: 10px;
  box-shadow: 0 12px 30px rgba(15, 23, 42, 0.28);
  padding: 6px;
  z-index: 1500;
}

.emoji-tabs {
  display: flex;
  flex-wrap: nowrap;
  overflow-x: auto;
  margin-bottom: 6px;
  gap: 4px;
}

.emoji-tab {
  white-space: nowrap;
  border-radius: 999px;
  border: none;
  background: #f3f4f6;
  color: #374151;
  padding: 4px 8px;
  cursor: pointer;
  font-size: 12px;
  font-weight: 600;
}
.emoji-tab.active {
  background: #10b981;
  color: #fff;
}

.emoji-list {
  display: grid;
  grid-template-columns: repeat(auto-fill, 32px);
  gap: 6px;
  max-height: 160px;
  overflow: auto;
}

.emoji-item {
  width: 32px;
  height: 32px;
  padding: 0;
  border: none;
  border-radius: 8px;
  background: #f3f4f6;
  display: flex;
  align-items: center;
  justify-content: center;
  cursor: pointer;
}

.emoji-img {
  max-width: 100%;
  max-height: 100%;
}

/* 其余细节可以从 origin_project/css/emoji.css 复制 */
</style>
