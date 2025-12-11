<template>
  <div class="friend-icon" @click="$emit('click')">
    <!-- 这里放你项目原来的“好友/消息”图标；下面是临时 svg -->
    <svg viewBox="0 0 24 24" width="24" height="24" aria-hidden="true">
      <circle cx="12" cy="8" r="4"></circle>
      <path d="M4 20c0-4 4-6 8-6s8 2 8 6"></path>
    </svg>

    <span v-if="displayCount" class="badge" aria-label="未读消息数">
      {{ displayCount }}
    </span>
  </div>
</template>

<script setup>
import { computed, onMounted } from 'vue';
import { useMessageBadgeStore } from '@/stores/messageBadge';
const store = useMessageBadgeStore();
onMounted(() => store.init());

const displayCount = computed(() => {
  const n = store.totalUnread || 0;
  if (n <= 0) return 0;
  return n > 99 ? '99+' : n;
});
</script>

<style scoped>
.friend-icon { position: relative; display: inline-flex; }
.badge {
  position: absolute; top: -6px; right: -6px;
  min-width: 18px; height: 18px; padding: 0 5px;
  background: #e02433; color: #fff; border-radius: 9999px;
  font-size: 12px; line-height: 18px; font-weight: 600; text-align: center;
}
</style>
