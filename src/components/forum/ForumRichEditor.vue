<!-- src/components/forum/ForumRichEditor.vue -->
<script setup>
import { computed, nextTick, onBeforeUnmount, onMounted, ref, watch } from 'vue'
import { ElMessageBox, ElMessage } from 'element-plus'
import EmojiPicker from '@/components/EmojiPicker.vue'
import { uploadForumImage } from '@/api/forum'
import { baseUrl } from '@/api/base'
import { joinUrl } from '@/utils/misc'
import { ensureRichTextColorStylesFromHtml } from '@/utils/richTextColor'

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

// 图片上传弹窗状态
const showImageUploader = ref(false)
const uploadedImages = ref([])
const uploadLoading = ref(false)
const uploadProgress = ref(0)
const fileInputRef = ref(null)

// 保存和恢复选择范围的改进实现
let savedRange = null

// 颜色
const textColor = ref('#000000')
const bgColor = ref('#ffffff')

// 颜色弹窗显隐（用于选色后自动关闭）
const textColorPopoverVisible = ref(false)
const bgColorPopoverVisible = ref(false)

// 旧版默认颜色面板（更接近旧站体验）
const COLOR_PALETTE = [
  '#000000', '#434343', '#666666', '#999999', '#b7b7b7', '#cccccc',
  '#980000', '#ff0000', '#ff9900', '#ffff00', '#00ff00', '#00ffff',
  '#4a86e8', '#0000ff', '#9900ff', '#ff00ff', '#e06666', '#f6b26b',
  '#ffd966', '#93c47d', '#76a5af'
]

function closeColorPopovers () {
  textColorPopoverVisible.value = false
  bgColorPopoverVisible.value = false
}

function pickTextColor (c) {
  textColor.value = c
  applyTextColor(c)
  closeColorPopovers()
}

function pickBgColor (c) {
  bgColor.value = c
  applyBgColor(c)
  closeColorPopovers()
}

function applyTextColorCustom () {
  applyTextColor(textColor.value)
  closeColorPopovers()
}

function applyBgColorCustom () {
  applyBgColor(bgColor.value)
  closeColorPopovers()
}

// 字号/标题菜单显隐
const fontSizeMenuVisible = ref(false)
const headingMenuVisible = ref(false)

// 处理点击外部关闭菜单
function handleClickOutside() {
  fontSizeMenuVisible.value = false
  headingMenuVisible.value = false
}
window.addEventListener('click', handleClickOutside)

function hexToClassPart (hex) {
  if (!hex) return ''
  return String(hex).replace('#', '').toLowerCase().replace(/[^0-9a-f]/g, '').slice(0, 6)
}

function saveSelection () {
  const sel = window.getSelection()
  if (!sel || sel.rangeCount === 0) return null

  const root = editorEl.value
  if (!root) return null

  const range = sel.getRangeAt(0)
  const common = range.commonAncestorContainer
  const commonEl = common.nodeType === 1 ? common : common.parentElement
  if (commonEl && root.contains(commonEl)) {
    savedRange = range.cloneRange()
    return savedRange
  }
  return savedRange
}

function restoreSelection () {
  const root = editorEl.value
  if (!root) return
  const sel = window.getSelection()
  if (!sel) return

  if (savedRange) {
    sel.removeAllRanges()
    sel.addRange(savedRange)
    root.focus()
    return
  }

  // 无 savedRange 时，将光标放到末尾
  const range = document.createRange()
  range.selectNodeContents(root)
  range.collapse(false)
  sel.removeAllRanges()
  sel.addRange(range)
  root.focus()
}

window.addEventListener('blur', () => {
  saveSelection()
})

function exec (command, value = null) {
  editorEl.value?.focus()
  restoreSelection()
  // eslint-disable-next-line deprecation/deprecation
  document.execCommand(command, false, value)
  syncToModel()
  saveSelection()
}

function syncToModel () {
  emit('update:modelValue', getContentAsTokens())
  // 确保 rt-c-xxxxxx / rt-bg-xxxxxx 的动态颜色 class 有对应 CSS（用于自定义颜色）
  if (editorEl.value) ensureRichTextColorStylesFromHtml(editorEl.value.innerHTML || '')
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
  } catch (e) {
    const frag = range.extractContents()
    span.appendChild(frag)
    range.insertNode(span)
  }

  range.setStartAfter(span)
  range.collapse(true)
  sel.removeAllRanges()
  sel.addRange(range)
  saveSelection()
}

function applyFontSize (n) {
  if (!n) return
  editorEl.value?.focus()
  restoreSelection()
  wrapSelectionWithSpanClass(`rt-fs-${n}`)
  editorEl.value?.focus()
  syncToModel()
}

function applyTextColor (hex) {
  const part = hexToClassPart(hex)
  if (!part) return
  editorEl.value?.focus()
  restoreSelection()
  wrapSelectionWithSpanClass(`rt-c-${part}`)
  editorEl.value?.focus()
  syncToModel()
}

function applyBgColor (hex) {
  const part = hexToClassPart(hex)
  if (!part) return
  editorEl.value?.focus()
  restoreSelection()
  wrapSelectionWithSpanClass(`rt-bg-${part}`)
  editorEl.value?.focus()
  syncToModel()
}

function applyHeading (tag) {
  if (!tag) return
  editorEl.value?.focus()
  restoreSelection()
  exec('formatBlock', `<${tag}>`)
  editorEl.value?.focus()
  syncToModel()
}

function applyBlockClass (cls) {
  const sel = window.getSelection()
  if (!sel || sel.rangeCount === 0) return
  const range = sel.getRangeAt(0)
  const block = range.startContainer?.parentElement?.closest('p,div,li,blockquote,h1,h2,h3,h4,h5,h6')
  if (!block) return
  block.classList.remove('rt-align-left', 'rt-align-center', 'rt-align-right')
  block.classList.add(cls)
  syncToModel()
}

function onPastePlain (e) {
  e.preventDefault()
  const text = e.clipboardData?.getData('text/plain') || ''
  exec('insertText', text)
  syncToModel()
}

function onInput () {
  syncToModel()
}

function onClick (e) {
  saveSelection()

  const t = e.target
  if (!(t instanceof HTMLElement)) return

  // 点击表情播放音频（保持你原逻辑）
  if (t.tagName === 'IMG' && t.classList.contains('rt-emoji')) {
    const audioPath = t.getAttribute('data-audio-path')
    if (audioPath && window?.EmojiAudioManager?.playAudio) {
      window.EmojiAudioManager.playAudio(joinUrl(baseUrl, audioPath))
    }
  }
}

// ====== token <-> html（保持你工程原写法） ======
function parseTokensToHtml (raw) {
  if (!raw) return ''
  let html = raw

  // 表情 token
  html = html.replace(/\[emoji:(\d+)\|([^\]]+)\|([^\]]*)\]/g, (_, id, path, audio) => {
    const src = joinUrl(baseUrl, path)
    const audioAttr = audio ? ` data-audio-path="${audio}"` : ''
    return `<img class="rt-emoji" data-emoji-id="${id}" data-emoji-path="${path}"${audioAttr} src="${src}" alt="emoji" />`
  })

  // 图片 token
  html = html.replace(/\[img:([^\]]+)\]/g, (_, path) => {
    const src = joinUrl(baseUrl, path)
    return `<img class="rt-image forum-uploaded-image" data-image-path="${path}" src="${src}" alt="image" />`
  })

  // 确保展示颜色 class 时也有对应 CSS
  ensureRichTextColorStylesFromHtml(html)
  return html
}

function getContentAsTokens () {
  const root = editorEl.value
  if (!root) return ''
  let html = root.innerHTML || ''

  // 图片转 token
  html = html.replace(/<img[^>]*class="[^"]*(?:rt-image|forum-uploaded-image)[^"]*"[^>]*data-image-path="([^"]+)"[^>]*>/g, (_, path) => {
    return `[img:${path}]`
  })

  // 表情转 token
  html = html.replace(/<img[^>]*class="[^"]*rt-emoji[^"]*"[^>]*data-emoji-id="([^"]+)"[^>]*data-emoji-path="([^"]+)"[^>]*(?:data-audio-path="([^"]+)")?[^>]*>/g,
      (_, id, path, audio) => `[emoji:${id}|${path}|${audio || ''}]`
  )

  return html
}

// ====== 表情插入：保持你原先对象插入方式，避免 [object Object] ======
function onSelectEmoji (emoji) {
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

  exec('insertText', ' ')
  syncToModel()
}

// ====== 插入链接（保持原结构；这里不改你旧逻辑） ======
async function insertLink () {
  const sel = window.getSelection()
  let selectedText = ''
  let range = null

  if (sel && sel.rangeCount > 0) {
    selectedText = sel.toString()
    range = sel.getRangeAt(0).cloneRange()
  }

  const result = await ElMessageBox.prompt(
      `<div style="display: flex; flex-direction: column; gap: 12px;">
      <div>
        <label style="display: block; margin-bottom: 4px; font-size: 14px; color: #606266;">链接文字</label>
        <input type="text" id="link-text-input" placeholder="请输入链接文字" value="${selectedText || ''}" style="width: 100%; padding: 8px; border: 1px solid #dcdfe6; border-radius: 4px; font-size: 14px;" />
      </div>
      <div>
        <label style="display: block; margin-bottom: 4px; font-size: 14px; color: #606266;">链接地址</label>
        <input type="text" id="link-url-input" placeholder="https://..." style="width: 100%; padding: 8px; border: 1px solid #dcdfe6; border-radius: 4px; font-size: 14px;" />
      </div>
    </div>`,
      '插入链接',
      {
        confirmButtonText: '插入',
        cancelButtonText: '取消',
        dangerouslyUseHTMLString: true,
        customClass: 'link-insert-dialog',
        callback: (action) => action,
      }
  ).catch(() => null)

  if (!result) return

  const textInput = document.getElementById('link-text-input')
  const urlInput = document.getElementById('link-url-input')

  const linkText = textInput?.value?.trim()
  const linkUrl = urlInput?.value?.trim()

  if (!linkText || !linkUrl) {
    ElMessage.warning('请输入链接文字和地址')
    return
  }

  editorEl.value?.focus()
  if (range) {
    savedRange = range
    restoreSelection()
  }

  const a = document.createElement('a')
  a.href = linkUrl
  a.target = '_blank'
  a.rel = 'noopener noreferrer'
  a.textContent = linkText

  const sel2 = window.getSelection()
  if (sel2 && sel2.rangeCount > 0) {
    const r = sel2.getRangeAt(0)
    r.deleteContents()
    r.insertNode(a)
    r.setStartAfter(a)
    r.collapse(true)
    sel2.removeAllRanges()
    sel2.addRange(r)
  } else {
    editorEl.value?.appendChild(a)
  }

  exec('insertText', ' ')
  syncToModel()
}

// ====== 图片上传：完全还原你原先弹层上传 ======
function closeImageUploader () {
  showImageUploader.value = false
  uploadProgress.value = 0
}

function triggerFileSelect () {
  fileInputRef.value?.click()
}

function handleFileInputChange (e) {
  const file = e.target.files?.[0]
  e.target.value = ''
  if (file) handleImageUpload(file)
}

function handleDrop (e) {
  e.preventDefault()
  const file = e.dataTransfer?.files?.[0]
  if (file) handleImageUpload(file)
}

function handleDragOver (e) {
  e.preventDefault()
}

async function handleImageUpload (file) {
  if (!file) return
  if (!file.type?.startsWith('image/')) {
    ElMessage.error('请选择图片文件')
    return
  }
  if (file.size > 300 * 1024) {
    ElMessage.error('图片大小不能超过 300KB')
    return
  }

  uploadLoading.value = true
  uploadProgress.value = 0

  const fd = new FormData()
  fd.append('image', file)

  try {
    const res = await uploadForumImage(fd, {
      onUploadProgress: (progressEvent) => {
        if (progressEvent.total) {
          uploadProgress.value = Math.round((progressEvent.loaded * 100) / progressEvent.total)
        }
      }
    })
    if (!res?.success || !res?.path) throw new Error(res?.error || '上传失败')

    uploadedImages.value.push({
      id: Date.now(),
      path: res.path,
      url: joinUrl(baseUrl, res.path),
      originalName: file.name
    })

    ElMessage.success('上传成功')
  } catch (err) {
    ElMessage.error(err?.message || '上传失败')
  } finally {
    uploadLoading.value = false
  }
}

function insertUploadedImage (imgObj) {
  if (!imgObj?.url) return
  const range = saveSelection()
  editorEl.value?.focus()
  restoreSelection(range)

  const img = document.createElement('img')
  img.className = 'rt-image forum-uploaded-image'
  img.setAttribute('data-image-path', String(imgObj.path || '').trim())
  img.src = String(imgObj.url)
  img.alt = imgObj.originalName || 'image'

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
  ElMessage.success('图片已插入')
}

async function deleteUploadedImage (index) {
  uploadedImages.value.splice(index, 1)
}

function clearFormat () {
  exec('removeFormat')
  nextTick(() => {
    editorEl.value?.focus()
    saveSelection()
  })
}

let internalApplying = false
watch(
    () => props.modelValue,
    async (val) => {
      if (internalApplying) return
      const root = editorEl.value
      if (!root) return

      const html = parseTokensToHtml(val || '')
      const current = root.innerHTML || ''
      if (current === html) return

      internalApplying = true
      root.innerHTML = html
      ensureRichTextColorStylesFromHtml(root.innerHTML || '')
      await nextTick()
      internalApplying = false
    },
    { immediate: true }
)

onMounted(() => nextTick(() => saveSelection()))
onBeforeUnmount(() => {
  window.removeEventListener('click', handleClickOutside)
})
</script>

<template>
  <div class="forum-editor-container">
    <div class="editor-toolbar">
      <!-- 字号选择器 -->
      <div class="toolbar-group">
        <div class="custom-select">
          <button type="button"
                  class="select-toggle"
                  @click.stop="fontSizeMenuVisible = !fontSizeMenuVisible"
                  @mousedown.stop.prevent="saveSelection()"
          >
            <i class="fas fa-text-height"></i>
            <span>字号</span>
            <i class="fas fa-caret-down"></i>
          </button>

          <div v-show="fontSizeMenuVisible" class="select-menu" @mousedown.stop.prevent>
            <div
                v-for="o in sizeOptions"
                :key="o.value"
                class="select-item"
                @mousedown.stop.prevent
                @click.stop="() => { applyFontSize(o.value); fontSizeMenuVisible = false; }"
            >
              {{ o.label }}
            </div>
          </div>
        </div>
      </div>

      <!-- 标题选择器 -->
      <div class="toolbar-group">
        <div class="custom-select">
          <button type="button"
                  class="select-toggle"
                  @click.stop="headingMenuVisible = !headingMenuVisible"
                  @mousedown.stop.prevent="saveSelection()"
          >
            <i class="fas fa-heading"></i>
            <span>标题</span>
            <i class="fas fa-caret-down"></i>
          </button>

          <div v-show="headingMenuVisible" class="select-menu" @mousedown.stop.prevent>
            <div
                v-for="o in headingOptions"
                :key="o.value"
                class="select-item"
                @mousedown.stop.prevent
                @click.stop="() => { applyHeading(o.value); headingMenuVisible = false; }"
            >
              {{ o.label }}
            </div>
          </div>
        </div>
      </div>

      <el-button-group>
        <el-button size="small" title="粗体" @click="exec('bold')" @mousedown.stop.prevent>
          <i class="fas fa-bold" />
        </el-button>
        <el-button size="small" title="斜体" @click="exec('italic')" @mousedown.stop.prevent>
          <i class="fas fa-italic" />
        </el-button>
        <el-button size="small" title="下划线" @click="exec('underline')" @mousedown.stop.prevent>
          <i class="fas fa-underline" />
        </el-button>
        <el-button size="small" title="删除线" @click="exec('strikeThrough')" @mousedown.stop.prevent>
          <i class="fas fa-strikethrough" />
        </el-button>
      </el-button-group>

      <!-- 文字 / 背景颜色：旧版风格面板，选色后自动关闭 -->
      <div class="toolbar-group editor-inline">
        <!-- 文字颜色 -->
        <el-popover
            v-model:visible="textColorPopoverVisible"
            placement="bottom"
            trigger="click"
            :width="280"
            @mousedown.stop.prevent
        >
          <template #reference>
            <el-button
                size="small"
                title="文字颜色"
                @mousedown.stop.prevent="saveSelection()"
                @click.stop="saveSelection()"
            >
              <span class="color-btn">
                <i class="fas fa-palette" />
                <span class="color-indicator" :style="{ background: textColor }"></span>
              </span>
            </el-button>
          </template>

          <div class="color-panel" @mousedown.stop.prevent>
            <div class="color-grid">
              <button
                  v-for="c in COLOR_PALETTE"
                  :key="c"
                  type="button"
                  class="color-cell"
                  :style="{ backgroundColor: c }"
                  @mousedown.stop.prevent
                  @click.stop="pickTextColor(c)"
                  :title="c"
              />
            </div>

            <div class="color-custom">
              <span class="color-label">自定义</span>
              <input v-model="textColor" type="color" class="color-input" @mousedown.stop.prevent />
              <el-button size="small" @mousedown.stop.prevent @click.stop="applyTextColorCustom">应用</el-button>
            </div>
          </div>
        </el-popover>

        <!-- 背景颜色 -->
        <el-popover
            v-model:visible="bgColorPopoverVisible"
            placement="bottom"
            trigger="click"
            :width="280"
            @mousedown.stop.prevent
        >
          <template #reference>
            <el-button
                size="small"
                title="背景颜色"
                @mousedown.stop.prevent="saveSelection()"
                @click.stop="saveSelection()"
            >
              <span class="color-btn">
                <i class="fas fa-fill-drip" />
                <span class="color-indicator" :style="{ background: bgColor }"></span>
              </span>
            </el-button>
          </template>

          <div class="color-panel" @mousedown.stop.prevent>
            <div class="color-grid">
              <button
                  v-for="c in COLOR_PALETTE"
                  :key="c"
                  type="button"
                  class="color-cell"
                  :style="{ backgroundColor: c }"
                  @mousedown.stop.prevent
                  @click.stop="pickBgColor(c)"
                  :title="c"
              />
            </div>

            <div class="color-custom">
              <span class="color-label">自定义</span>
              <input v-model="bgColor" type="color" class="color-input" @mousedown.stop.prevent />
              <el-button size="small" @mousedown.stop.prevent @click.stop="applyBgColorCustom">应用</el-button>
            </div>
          </div>
        </el-popover>
      </div>

      <!-- 文字对齐 -->
      <el-button-group>
        <el-button size="small" title="左对齐" @click="applyBlockClass('rt-align-left')" @mousedown.stop.prevent>
          <i class="fas fa-align-left" />
        </el-button>
        <el-button size="small" title="居中" @click="applyBlockClass('rt-align-center')" @mousedown.stop.prevent>
          <i class="fas fa-align-center" />
        </el-button>
        <el-button size="small" title="右对齐" @click="applyBlockClass('rt-align-right')" @mousedown.stop.prevent>
          <i class="fas fa-align-right" />
        </el-button>
      </el-button-group>

      <!-- 表情 -->
      <el-popover placement="bottom" trigger="click" width="420" @mousedown.stop.prevent>
        <template #reference>
          <el-button size="small" title="插入表情" @mousedown.stop.prevent="saveSelection()">
            <i class="fas fa-smile" />
          </el-button>
        </template>
        <EmojiPicker @select="onSelectEmoji" />
      </el-popover>

      <!-- 插入链接 -->
      <el-button size="small" title="插入链接" @click="insertLink" @mousedown.stop.prevent>
        <i class="fas fa-link" />
      </el-button>

      <!-- 图片上传弹层 -->
      <el-popover
          v-model:visible="showImageUploader"
          placement="bottom"
          width="500px"
          trigger="click"
          @mousedown.stop.prevent
      >
        <template #reference>
          <el-button size="small" title="上传图片" @mousedown.stop.prevent="saveSelection()">
            <i class="fas fa-image" />
          </el-button>
        </template>

        <div class="image-uploader-container">
          <div class="uploader-header">
            <h3>上传图片</h3>
          </div>

          <div class="uploader-body">
            <div
                class="upload-area"
                @click="triggerFileSelect"
                @drop="handleDrop"
                @dragover="handleDragOver"
            >
              <i class="fas fa-cloud-upload-alt" style="font-size: 32px; color: #909399;"></i>
              <p style="margin: 8px 0;">点击或拖拽上传图片</p>
              <p style="font-size: 12px; color: #909399;">最大300KB，支持JPG/PNG/GIF</p>

              <input
                  ref="fileInputRef"
                  type="file"
                  accept="image/*"
                  style="display: none;"
                  @change="handleFileInputChange"
              />
            </div>

            <div v-if="uploadLoading" class="upload-progress">
              <div class="progress-info">
                <span>上传中...</span>
                <span>{{ uploadProgress }}%</span>
              </div>
              <el-progress :percentage="uploadProgress" :stroke-width="8" />
            </div>

            <div v-if="uploadedImages.length > 0" class="uploaded-images">
              <h4>已上传图片</h4>
              <div class="image-list">
                <div v-for="(img, index) in uploadedImages" :key="img.id" class="image-item">
                  <img :src="img.url" class="thumbnail" />
                  <div class="image-info">
                    <div class="name">{{ img.originalName }}</div>
                    <div class="actions">
                      <el-button size="small" type="primary" @click="insertUploadedImage(img)" @mousedown.stop.prevent>
                        插入
                      </el-button>
                      <el-button size="small" type="danger" @click="deleteUploadedImage(index)" @mousedown.stop.prevent>
                        删除
                      </el-button>
                    </div>
                  </div>
                </div>
              </div>
            </div>

            <div class="uploader-footer">
              <el-button @click="closeImageUploader">关闭</el-button>
            </div>
          </div>
        </div>
      </el-popover>

      <el-button size="small" title="清除格式" @click="clearFormat" @mousedown.stop.prevent>
        <i class="fas fa-eraser" />
      </el-button>
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
        @mouseup.stop="saveSelection"
        @keyup.stop="saveSelection"
        @focus="saveSelection"
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

.toolbar-group {
  display: inline-flex;
  align-items: center;
  gap: 6px;
}

/* 自定义下拉 */
.custom-select {
  position: relative;
}

.select-toggle {
  display: inline-flex;
  align-items: center;
  gap: 6px;
  border: 1px solid var(--el-border-color);
  background: #fff;
  border-radius: 6px;
  padding: 6px 10px;
  cursor: pointer;
  user-select: none;
  font-size: 12px;
}

.select-menu {
  position: absolute;
  top: calc(100% + 6px);
  left: 0;
  z-index: 50;
  min-width: 140px;
  background: #fff;
  border: 1px solid var(--el-border-color);
  border-radius: 8px;
  box-shadow: 0 8px 20px rgba(0, 0, 0, 0.08);
  padding: 6px;
}

.select-item {
  padding: 8px;
  border-radius: 6px;
  cursor: pointer;
  font-size: 12px;
}

.select-item:hover {
  background: var(--el-fill-color-light);
}

/* 编辑区 */
.editor-content {
  padding: 12px;
  outline: none;
  line-height: 1.7;
  font-size: 14px;
  word-break: break-word;
}

.editor-content:empty:before {
  content: attr(data-placeholder);
  color: var(--el-text-color-placeholder);
}

/* 上传弹层 */
.image-uploader-container { padding: 8px; }
.uploader-header h3 { margin: 0 0 8px; font-size: 14px; }
.upload-area {
  border: 1px dashed var(--el-border-color);
  border-radius: 10px;
  padding: 16px;
  text-align: center;
  cursor: pointer;
  background: #fff;
}
.upload-progress { margin-top: 12px; }
.progress-info { display: flex; justify-content: space-between; font-size: 12px; margin-bottom: 6px; }
.uploaded-images { margin-top: 12px; }
.image-list { display: flex; flex-direction: column; gap: 10px; }
.image-item { display: flex; gap: 10px; align-items: center; }
.thumbnail { width: 64px; height: 64px; object-fit: cover; border-radius: 8px; border: 1px solid var(--el-border-color); }
.image-info { flex: 1; }
.image-info .name { font-size: 12px; color: var(--el-text-color-regular); margin-bottom: 6px; }
.image-info .actions { display: flex; gap: 8px; }
.uploader-footer { display: flex; justify-content: flex-end; margin-top: 12px; }

/* ===== 颜色面板：旧版风格（点开直接选色） ===== */
.color-btn{
  display:inline-flex;
  flex-direction:column;
  align-items:center;
  gap:2px;
  line-height:1;
}
.color-indicator{
  width:20px;
  height:3px;
  border-radius:2px;
  background:#000;
}

.color-panel {
  width: 240px;
  box-sizing: border-box;
  padding: 12px;
}

.color-grid {
  display: grid;
  grid-template-columns: repeat(6, 20px);
  gap: 6px;
  padding-bottom: 12px;
}

.color-cell {
  width: 20px;
  height: 20px;
  border-radius: 4px;
  border: 1px solid rgba(0,0,0,0.12);
  cursor: pointer;
  padding: 0;
  background: transparent;
}

.color-custom {
  display: flex;
  align-items: center;
  gap: 8px;
  padding-top: 10px;
  border-top: 1px solid var(--el-border-color);
}

.color-label {
  font-size: 12px;
  color: var(--el-text-color-secondary);
}

.color-input {
  width: 40px;
  height: 30px;
  padding: 0;
  border: 1px solid #ddd;
  border-radius: 4px;
  cursor: pointer;
  background: transparent;
}
</style>
