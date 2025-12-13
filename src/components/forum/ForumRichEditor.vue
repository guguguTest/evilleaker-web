<!-- src/components/forum/ForumRichEditor.vue -->
<script setup>
import { computed, nextTick, onBeforeUnmount, onMounted, ref, watch } from 'vue'
import { ElMessageBox, ElMessage } from 'element-plus'
import EmojiPicker from '@/components/EmojiPicker.vue'
import { uploadForumImage } from '@/api/forum'
import { baseUrl } from '@/api/base'
import { joinUrl } from '@/utils/misc'

const props = defineProps({
  modelValue: { type: String, default: '' },
  placeholder: { type: String, default: '请输入内容…' },
  minHeight: { type: [String, Number], default: 220 },
})

const emit = defineEmits(['update:modelValue'])

const editorEl = ref(null)

// ------ 富文本“样式类”编码：后端只允许 class，不允许 style ------
const FONT_SIZES = [12, 14, 16, 18, 22, 28]
const sizeOptions = FONT_SIZES.map(n => ({ label: `${n}px`, value: n }))
const headingOptions = [
  { label: '正文', value: 'p' },
  { label: 'H1', value: 'h1' },
  { label: 'H2', value: 'h2' },
  { label: 'H3', value: 'h3' },
  { label: 'H4', value: 'h4' },
  { label: 'H5', value: 'h5' },
  { label: 'H6', value: 'h6' },
]

const editorMinHeight = computed(() =>
  typeof props.minHeight === 'number' ? `${props.minHeight}px` : props.minHeight
)

function hexToClassPart (hex) {
  if (!hex) return ''
  return String(hex).replace('#', '').toLowerCase().replace(/[^0-9a-f]/g, '').slice(0, 6)
}

function saveSelection () {
  const sel = window.getSelection()
  if (!sel || sel.rangeCount === 0) return null
  return sel.getRangeAt(0).cloneRange()
}

function restoreSelection (range) {
  if (!range) return
  const sel = window.getSelection()
  sel?.removeAllRanges()
  sel?.addRange(range)
}

function wrapSelectionWithSpanClass (cls) {
  const sel = window.getSelection()
  if (!sel || sel.rangeCount === 0) return
  const range = sel.getRangeAt(0)
  if (range.collapsed) return

  const span = document.createElement('span')
  span.className = cls

  try {
    range.surroundContents(span)
  } catch (_e) {
    const frag = range.extractContents()
    span.appendChild(frag)
    range.insertNode(span)
  }

  // 重新选中
  range.selectNodeContents(span)
  sel.removeAllRanges()
  sel.addRange(range)
}

function exec (cmd, value = null) {
  editorEl.value?.focus()
  try {
    document.execCommand(cmd, false, value)
  } catch (e) {
    console.error('execCommand failed', cmd, e)
  }
  editorEl.value?.focus()
}

function closestBlock (node) {
  let el = node?.nodeType === 1 ? node : node?.parentElement
  while (el && el !== editorEl.value) {
    const tag = el.tagName
    if (['P','DIV','H1','H2','H3','H4','H5','H6','BLOCKQUOTE','PRE','LI'].includes(tag)) return el
    el = el.parentElement
  }
  return null
}

function applyBlockClass (cls) {
  const sel = window.getSelection()
  if (!sel || sel.rangeCount === 0) return
  const range = sel.getRangeAt(0)
  const block = closestBlock(range.commonAncestorContainer)
  if (!block) return
  // 仅保留一个对齐类
  block.classList.remove('rt-align-left', 'rt-align-center', 'rt-align-right')
  block.classList.add(cls)
  emitContent()
}

function applyFontSize (n) {
  if (!n) return
  wrapSelectionWithSpanClass(`rt-fs-${n}`)
  syncToModel()
}

function applyTextColor (hex) {
  const part = hexToClassPart(hex)
  if (!part) return
  wrapSelectionWithSpanClass(`rt-c-${part}`)
  syncToModel()
}

function applyBgColor (hex) {
  const part = hexToClassPart(hex)
  if (!part) return
  wrapSelectionWithSpanClass(`rt-bg-${part}`)
  syncToModel()
}

function applyHeading (tag) {
  if (!tag) return
  exec('formatBlock', `<${tag}>`)
  syncToModel()
}

async function insertLink () {
  const sel = window.getSelection()
  if (!sel || sel.rangeCount === 0) {
    ElMessage.warning('请先选中要加链接的文本')
    return
  }
  const text = sel.toString()
  if (!text) {
    ElMessage.warning('请先选中要加链接的文本')
    return
  }

  const url = await ElMessageBox.prompt('请输入链接（http/https）', '插入链接', {
    confirmButtonText: '插入',
    cancelButtonText: '取消',
    inputPattern: /^https?:\/\//i,
    inputErrorMessage: '请输入以 http(s):// 开头的链接',
  }).then(r => r.value).catch(() => '')
  if (!url) return

  exec('createLink', url)
  // 给 a 补上安全属性
  await nextTick()
  const a = editorEl.value?.querySelector('a[href="' + url.replace(/"/g, '') + '"]')
  if (a) {
    a.setAttribute('target', '_blank')
    a.setAttribute('rel', 'noopener noreferrer')
  }
  syncToModel()
}

function getContentAsTokens () {
  const root = editorEl.value
  if (!root) return ''
  let html = root.innerHTML || ''

  // emoji: <img class="rt-emoji" data-emoji-id data-emoji-path data-audio-path>
  html = html.replace(/<img[^>]*class=["'][^"']*rt-emoji[^"']*["'][^>]*>/gi, (m) => {
    const id = (m.match(/data-emoji-id=["'](\d+)["']/i) || [])[1]
    const path = (m.match(/data-emoji-path=["']([^"']+)["']/i) || [])[1]
    const audio = (m.match(/data-audio-path=["']([^"']+)["']/i) || [])[1]
    if (id && path) {
      const p = path.trim()
      const a = audio ? audio.trim() : ''
      return a ? `[emoji:${id}:${p}:${a}]` : `[emoji:${id}:${p}]`
    }
    return ''
  })

  // image: <img class="rt-image" data-image-path>
  html = html.replace(/<img[^>]*class=["'][^"']*rt-image[^"']*["'][^>]*>/gi, (m) => {
    const path = (m.match(/data-image-path=["']([^"']+)["']/i) || [])[1]
    if (path) return `[image:${path.trim()}]`
    return ''
  })

  return html.trim()
}

function parseTokensToHtml (raw) {
  if (!raw) return ''
  let html = raw

  // [emoji:id:/path(:/audio)] => <img>
  html = html.replace(/\[emoji:(\d+):([^:\]]+)(?::([^\]]+))?\]/g, (_m, id, p, a) => {
    const src = joinUrl(baseUrl, String(p).trim())
    const audioPath = a ? String(a).trim() : ''
    const audioAttr = audioPath ? ` data-audio-path="${audioPath}"` : ''
    return `<img class="rt-emoji" data-emoji-id="${id}" data-emoji-path="${String(p).trim()}"${audioAttr} src="${src}" alt="emoji" />`
  })

  // [image:/uploads/..] => <img>
  html = html.replace(/\[image:([^\]]+)\]/g, (_m, p) => {
    const path = String(p).trim()
    const src = joinUrl(baseUrl, path)
    return `<img class="rt-image" data-image-path="${path}" src="${src}" alt="image" />`
  })

  return html
}

function syncToModel () {
  emit('update:modelValue', getContentAsTokens())
}

async function onSelectEmoji (emoji) {
  if (!emoji?.id || !emoji?.file_path) return
  const range = saveSelection()
  editorEl.value?.focus()
  restoreSelection(range)

  const img = document.createElement('img')
  img.className = 'rt-emoji'
  img.setAttribute('data-emoji-id', String(emoji.id))
  img.setAttribute('data-emoji-path', String(emoji.file_path).trim())
  if (emoji.sound_path) img.setAttribute('data-audio-path', String(emoji.sound_path).trim())
  img.src = joinUrl(baseUrl, emoji.file_path)
  img.alt = emoji.emoji_name || 'emoji'

  const sel = window.getSelection()
  if (sel && sel.rangeCount > 0) {
    const r = sel.getRangeAt(0)
    r.deleteContents()
    r.insertNode(img)
    r.setStartAfter(img)
    r.collapse(true)
    sel.removeAllRanges()
    sel.addRange(r)
  } else {
    editorEl.value?.appendChild(img)
  }

  // 补一个空格
  exec('insertText', ' ')
  syncToModel()
}

async function onPickImage (file) {
  if (!file) return
  if (!file.type?.startsWith('image/')) {
    ElMessage.error('请选择图片文件')
    return
  }
  if (file.size > 300 * 1024) {
    ElMessage.error('图片大小不能超过 300KB')
    return
  }

  const fd = new FormData()
  fd.append('image', file)

  try {
    const res = await uploadForumImage(fd)
    if (!res?.success || !res?.path) throw new Error(res?.error || '上传失败')

    const range = saveSelection()
    editorEl.value?.focus()
    restoreSelection(range)

    const img = document.createElement('img')
    img.className = 'rt-image'
    img.setAttribute('data-image-path', res.path)
    img.src = joinUrl(baseUrl, res.path)
    img.alt = 'image'

    const sel = window.getSelection()
    if (sel && sel.rangeCount > 0) {
      const r = sel.getRangeAt(0)
      r.deleteContents()
      r.insertNode(img)
      r.setStartAfter(img)
      r.collapse(true)
      sel.removeAllRanges()
      sel.addRange(r)
    } else {
      editorEl.value?.appendChild(img)
    }

    exec('insertText', ' ')
    syncToModel()
  } catch (e) {
    console.error(e)
    ElMessage.error(e?.message || '上传失败')
  }
}

function onPastePlain (e) {
  // 强制粘贴为纯文本，避免把 style / 外部 HTML 带入
  e.preventDefault()
  const text = e.clipboardData?.getData('text/plain') || ''
  exec('insertText', text)
  syncToModel()
}

function onInput () {
  syncToModel()
}

function onClick (e) {
  const t = e.target
  if (!(t instanceof HTMLElement)) return

  // 点击音频表情就播放（如果有全局播放器的话）
  if (t.tagName === 'IMG' && t.classList.contains('rt-emoji')) {
    const audioPath = t.getAttribute('data-audio-path')
    if (audioPath && window?.EmojiAudioManager?.playAudio) {
      window.EmojiAudioManager.playAudio(joinUrl(baseUrl, audioPath))
    }
  }
}

let internalApplying = false

watch(
  () => props.modelValue,
  async (val) => {
    if (internalApplying) return
    const root = editorEl.value
    if (!root) return
    // 避免频繁重置光标：只有当内容确实不同才更新
    const currentTokens = getContentAsTokens()
    if ((val || '') === (currentTokens || '')) return
    internalApplying = true
    root.innerHTML = parseTokensToHtml(val)
    await nextTick()
    internalApplying = false
  },
  { immediate: true }
)

onMounted(() => {
  // 初始化一次
  if (editorEl.value) {
    editorEl.value.innerHTML = parseTokensToHtml(props.modelValue)
  }
})

onBeforeUnmount(() => {
  // noop
})
</script>

<template>
  <div class="forum-editor-container">
    <div class="editor-toolbar">
      <el-select
        size="small"
        style="width: 90px"
        placeholder="字号"
        @change="applyFontSize"
        clearable
      >
        <el-option
          v-for="o in sizeOptions"
          :key="o.value"
          :label="o.label"
          :value="o.value"
        />
      </el-select>

      <el-select
        size="small"
        style="width: 80px"
        placeholder="标题"
        @change="applyHeading"
        clearable
      >
        <el-option
          v-for="o in headingOptions"
          :key="o.value"
          :label="o.label"
          :value="o.value"
        />
      </el-select>

      <el-button-group>
        <el-button size="small" title="粗体" @click="exec('bold')"><i class="fas fa-bold" /></el-button>
        <el-button size="small" title="斜体" @click="exec('italic')"><i class="fas fa-italic" /></el-button>
        <el-button size="small" title="下划线" @click="exec('underline')"><i class="fas fa-underline" /></el-button>
        <el-button size="small" title="删除线" @click="exec('strikeThrough')"><i class="fas fa-strikethrough" /></el-button>
      </el-button-group>

      <div class="editor-inline">
        <el-color-picker size="small" @change="applyTextColor" title="文字颜色" />
        <el-color-picker size="small" @change="applyBgColor" title="背景颜色" />
      </div>

      <el-button-group>
        <el-button size="small" title="左对齐" @click="applyBlockClass('rt-align-left')"><i class="fas fa-align-left" /></el-button>
        <el-button size="small" title="居中" @click="applyBlockClass('rt-align-center')"><i class="fas fa-align-center" /></el-button>
        <el-button size="small" title="右对齐" @click="applyBlockClass('rt-align-right')"><i class="fas fa-align-right" /></el-button>
      </el-button-group>

      <el-button-group>
        <el-button size="small" title="无序列表" @click="exec('insertUnorderedList')"><i class="fas fa-list-ul" /></el-button>
        <el-button size="small" title="有序列表" @click="exec('insertOrderedList')"><i class="fas fa-list-ol" /></el-button>
      </el-button-group>

      <el-button size="small" title="插入链接" @click="insertLink"><i class="fas fa-link" /></el-button>

      <label class="editor-upload-btn" title="上传图片">
        <i class="fas fa-image" />
        <input type="file" accept="image/*" @change="(e) => onPickImage(e.target.files?.[0])" />
      </label>

      <el-popover placement="bottom" width="380" trigger="click">
        <template #reference>
          <el-button size="small" title="插入表情"><i class="far fa-smile" /></el-button>
        </template>
        <EmojiPicker @select="onSelectEmoji" />
      </el-popover>

      <el-button size="small" title="清除格式" @click="exec('removeFormat')"><i class="fas fa-eraser" /></el-button>
    </div>

    <div
      ref="editorEl"
      class="editor-content"
      :data-placeholder="placeholder"
      :style="{ minHeight: editorMinHeight }"
      contenteditable="true"
      @paste="onPastePlain"
      @input="onInput"
      @click="onClick"
    />
  </div>
</template>

<style scoped>
.forum-editor-container {
  border: 1px solid var(--el-border-color);
  border-radius: 10px;
  overflow: hidden;
  background: #fff;
}

.editor-toolbar {
  display: flex;
  flex-wrap: wrap;
  gap: 8px;
  padding: 10px;
  background: var(--el-fill-color-lighter);
  border-bottom: 1px solid var(--el-border-color);
  align-items: center;
}

.editor-inline {
  display: inline-flex;
  gap: 8px;
  align-items: center;
}

.editor-upload-btn {
  display: inline-flex;
  align-items: center;
  justify-content: center;
  width: 32px;
  height: 32px;
  border-radius: 6px;
  cursor: pointer;
  border: 1px solid var(--el-border-color);
  background: #fff;
  color: var(--el-text-color-regular);
}

.editor-upload-btn:hover {
  background: var(--el-fill-color);
}

.editor-upload-btn input {
  display: none;
}

.editor-content {
  padding: 14px;
  line-height: 1.7;
  font-size: 14px;
  outline: none;
}

.editor-content:empty:before {
  content: attr(data-placeholder);
  color: #9ca3af;
}

.editor-content :deep(img.rt-emoji) {
  max-width: 80px;
  max-height: 80px;
  vertical-align: middle;
  border-radius: 6px;
  margin: 0 4px;
}

.editor-content :deep(img.rt-image) {
  max-width: 50%;
  height: auto;
  display: inline-block;
  margin: 6px 4px;
  border-radius: 8px;
}
</style>
