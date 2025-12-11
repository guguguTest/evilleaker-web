<template>
  <div class="friend-item" @click="$emit('open', friend.id)">
    <img class="avatar" :src="friend.avatar" alt="" />
    <div class="meta">
      <div class="name">{{ friend.nickname || friend.username }}</div>
      <div class="desc">{{ friend.signature || '' }}</div>
    </div>
    <span v-if="count" class="badge">{{ count > 99 ? '99+' : count }}</span>
  </div>
</template>

<script setup>
import { computed } from 'vue';
import { useMessageBadgeStore } from '@/stores/messageBadge';
const props = defineProps({ friend: { type: Object, required: true } });
const store = useMessageBadgeStore();
const count = computed(() => store.getFriendUnread(props.friend.id));
</script>

<style scoped>
.friend-item { position: relative; display: flex; align-items: center; padding: 10px 12px; }
.avatar { width: 36px; height: 36px; border-radius: 50%; object-fit: cover; }
.meta { margin-left: 10px; flex: 1 1 auto; min-width: 0; }
.name { font-weight: 600; }
.desc { color: #888; font-size: 12px; overflow: hidden; text-overflow: ellipsis; white-space: nowrap; }
.badge {
  position: absolute; right: 10px; top: 50%; transform: translateY(-50%);
  min-width: 18px; height: 18px; padding: 0 5px;
  background: #e02433; color: #fff; border-radius: 9999px;
  font-size: 12px; line-height: 18px; font-weight: 600; text-align: center;
}
</style>
