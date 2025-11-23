<script setup>
import {ref} from 'vue';
import {useI18nStore} from '@/stores/i18n';

const i18nStore = useI18nStore();

const props = defineProps({
  title: {
    type: String,
    default: '标题'
  },
  content: {
    type: String,
    required: true
  },
  closeButtonText: {
    type: String,
    default: '关闭'
  },
});

const visible = ref(false);
// const translateBtn = ref('Translate');
const contentTranslated = ref('');
let translating = ref(false); // 是否翻译中
let translate = ref(false); // 显示翻译还是原文
let resolveFn = null; // 窗口关闭回调

const open = () => {
  visible.value = true;
}

const close = () => {
  visible.value = false;
  // 等待动画
  setTimeout(() => {
    if (resolveFn) resolveFn();
  }, 200);
}

const translateAnnModal = async () => {
  if (translating.value)
    return;
  const lang = i18nStore.lang;
  if (!translate.value) {
    if (!contentTranslated.value) {
      translating.value = true;
      contentTranslated.value = await translateText(props.content, lang);
      translating.value = false;
    }
  }
  translate.value = !translate.value;
}

const translateText = async (text, targetLang) => {
  await new Promise(resolve => setTimeout(resolve, 5000));

  try {
    const url = `https://translate.googleapis.com/translate_a/single?client=gtx&sl=zh-CN&tl=${targetLang}&dt=t&q=${encodeURIComponent(text)}`;
    const response = await fetch(url);
    const data = await response.json();
    if (data && data[0]) {
      return data[0].map(item => item[0]).join('');
    }
    throw new Error('翻译数据格式错误');
  } catch (error) {
    console.warn('API翻译失败，使用备用方案');
    window.open(`https://translate.google.com/?sl=zh-CN&tl=${targetLang}&text=${encodeURIComponent(text)}&op=translate`, '_blank');
    throw error;
  }
}

// 暴露方法给外部调用
defineExpose({
  open,
  resolve: (fn) => {
    resolveFn = fn;
  }
});
</script>

<template>
  <Teleport to="body">
    <div class="announcement-modal" id="announcement-modal" :class="{show: visible}" @click="close">
      <div class="announcement-modal-content" @click.stop>
        <div class="announcement-modal-header">
          <h3 class="announcement-modal-title">{{ title }}</h3>
          <div class="announcement-modal-actions">
            <button class="announcement-translate-btn" title="Translate" v-if="i18nStore.lang !== 'zh'"
                    @click="translateAnnModal">
              <i class="fas fa-language"></i>
              <span class="translate-text">
                {{ translating ? 'Translating...' : (translate ? 'Original' : 'Translate') }}
              </span>
            </button>
            <button class="announcement-modal-close" @click="close">&times;</button>
          </div>
        </div>
        <div class="announcement-modal-body">
          <div class="html-content" v-html="translate ? contentTranslated : content"></div>
        </div>
        <div class="announcement-modal-footer">
          <button class="announcement-modal-ok" @click="close">关闭</button>
        </div>
      </div>
    </div>
  </Teleport>
</template>

<style scoped>

</style>