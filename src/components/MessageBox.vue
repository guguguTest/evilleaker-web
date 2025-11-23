<script setup>
import {ref} from 'vue'

const props = defineProps({
  title: {
    type: String,
    default: '提示信息'
  },
  message: {
    type: String,
    required: true
  },
  showCancelButton: {
    type: Boolean,
    default: false
  },
  confirmButtonText: {
    type: String,
    default: '确定'
  },
  cancelButtonText: {
    type: String,
    default: '取消'
  }
})

const visible = ref(false)
let resolveFn = null

const open = () => {
  visible.value = true
}

const close = () => {
  visible.value = false
  // 等待动画
  setTimeout(() => {
    if (resolveFn) resolveFn(false)
  }, 200)
}

const confirm = () => {
  visible.value = false
  // 等待动画
  setTimeout(() => {
    if (resolveFn) resolveFn(true)
  }, 200)
}

const cancel = () => {
  close()
}

defineExpose({
  open,
  close,
  resolve: (fn) => {
    resolveFn = fn
  }
})
</script>

<template>
  <Teleport to="body">
    <div id="message-modal" class="modal" :class="{show: visible}" @click="cancel">
      <div class="modal-content" @click.stop>
        <div class="modal-header">
          <h5 id="modal-title">{{ title }}</h5>
          <button type="button" class="modal-close" @click="cancel">&times;</button>
        </div>
        <div class="modal-body">
          <p id="modal-content">{{ message }}</p>
        </div>
        <div class="modal-footer">
          <button class="btn-ok" @click="confirm">{{ confirmButtonText }}</button>
          <button class="btn-ok" v-if="showCancelButton" @click="cancel">{{ cancelButtonText }}</button>
        </div>
      </div>
    </div>
  </Teleport>
</template>

<style scoped>

</style>