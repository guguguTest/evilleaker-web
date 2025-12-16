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

// 图片上传弹窗状态
const showImageUploader = ref(false)
const uploadedImages = ref([])
const uploadLoading = ref(false)
const uploadProgress = ref(0)
// 文件上传输入框ref
const fileInputRef = ref(null)

function hexToClassPart (hex) {
  if (!hex) return ''
  return String(hex).replace('#', '').toLowerCase().replace(/[^0-9a-f]/g, '').slice(0, 6)
}

// 保存和恢复选择范围的改进实现
// 使用闭包保存选择范围，确保在任何情况下都能恢复
let savedRange = null

// 颜色选择器绑定的值
const textColor = ref('#000000')
const bgColor = ref('#ffffff')

// 自定义选择器的菜单可见性
const fontSizeMenuVisible = ref(false)
const headingMenuVisible = ref(false)

// 处理点击外部关闭菜单
function handleClickOutside() {
  fontSizeMenuVisible.value = false
  headingMenuVisible.value = false
}

// 监听全局点击事件，关闭菜单
window.addEventListener('click', handleClickOutside)

function saveSelection () {
  const sel = window.getSelection()
  if (!sel || sel.rangeCount === 0) return null
  savedRange = sel.getRangeAt(0).cloneRange()
  return savedRange
}

function restoreSelection (range = savedRange) {
  if (!range) return
  const sel = window.getSelection()
  sel?.removeAllRanges()
  sel?.addRange(range)
  // 重新聚焦编辑器，确保选择可见
  editorEl.value?.focus()
}

// 监听窗口焦点变化，保存选择
window.addEventListener('blur', () => {
  saveSelection()
})

// 监听选择变化，更新保存的范围
window.addEventListener('mouseup', () => {
  saveSelection()
})
window.addEventListener('keyup', () => {
  saveSelection()
})

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

// 处理工具栏按钮的mousedown事件，防止默认行为导致失去选择
function handleToolbarMouseDown(e) {
  e.preventDefault()
  // 保存选择范围
  saveSelection()
}

// 处理工具栏按钮的点击事件，确保在应用样式前恢复选择
function handleToolbarClick(e) {
  // 恢复选择范围
  // 注意：这里不需要显式恢复，因为我们在每个apply函数中已经处理了
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

async function insertLink () {
  const sel = window.getSelection()
  let selectedText = ''
  let range = null
  
  // 保存当前选择范围和选中文字
  if (sel && sel.rangeCount > 0) {
    selectedText = sel.toString()
    range = sel.getRangeAt(0).cloneRange()
  }
  
  // 使用ElMessageBox的自定义表单，允许用户输入链接文字和URL
  const result = await ElMessageBox.prompt(
    `<div style="display: flex; flex-direction: column; gap: 12px;">
      <div>
        <label style="display: block; margin-bottom: 4px; font-size: 14px; color: #606266;">链接文字</label>
        <input type="text" id="link-text-input" placeholder="请输入链接文字" value="${selectedText}" style="width: 100%; padding: 8px; border: 1px solid #dcdfe6; border-radius: 4px; font-size: 14px;">
      </div>
      <div>
        <label style="display: block; margin-bottom: 4px; font-size: 14px; color: #606266;">链接地址</label>
        <input type="text" id="link-url-input" placeholder="请输入链接地址（http/https）" style="width: 100%; padding: 8px; border: 1px solid #dcdfe6; border-radius: 4px; font-size: 14px;">
      </div>
    </div>`,
    '插入链接',
    {
      confirmButtonText: '插入',
      cancelButtonText: '取消',
      dangerouslyUseHTMLString: true,
      beforeClose: (action, instance, done) => {
        if (action === 'confirm') {
          const textInput = document.getElementById('link-text-input')
          const urlInput = document.getElementById('link-url-input')
          const text = textInput?.value?.trim()
          const url = urlInput?.value?.trim()
          
          if (!text) {
            ElMessage.warning('请输入链接文字')
            return
          }
          
          if (!/^https?:\/\//i.test(url)) {
            ElMessage.warning('请输入以 http(s):// 开头的链接')
            return
          }
          
          instance.content = {
            text,
            url
          }
        }
        done()
      }
    }
  ).then(r => r.content).catch(() => null)
  
  if (!result || !result.text || !result.url) return
  
  editorEl.value?.focus()
  
  if (range) {
    // 恢复选择范围
    sel?.removeAllRanges()
    sel?.addRange(range)
  } else {
    // 如果没有选择范围，插入到当前光标位置
    const cursorPos = window.getSelection()?.anchorOffset || 0
    const parentNode = window.getSelection()?.anchorNode?.parentElement || editorEl.value
    const textNode = document.createTextNode(result.text)
    parentNode?.appendChild(textNode)
    
    // 创建新的选择范围
    const newRange = document.createRange()
    newRange.setStart(textNode, 0)
    newRange.setEnd(textNode, result.text.length)
    sel?.removeAllRanges()
    sel?.addRange(newRange)
  }
  
  // 应用链接
  exec('createLink', result.url)
  
  // 给 a 补上安全属性
  await nextTick()
  const a = editorEl.value?.querySelector('a[href="' + result.url.replace(/"/g, '') + '"]')
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
    ElMessage.success('图片上传成功')
  } catch (e) {
    console.error(e)
    ElMessage.error(e?.message || '上传失败')
  } finally {
    uploadLoading.value = false
    uploadProgress.value = 0
  }
}

async function insertImageToEditor (image) {
  editorEl.value?.focus()
  const range = saveSelection()
  if (!range) return

  const img = document.createElement('img')
  img.className = 'rt-image'
  img.setAttribute('data-image-path', image.path)
  img.src = image.url
  img.alt = image.originalName

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
  
  // 为整个工具栏添加mousedown事件监听器，防止失去选择范围
  // 这是原版forum-editor.js的核心解决方案
  const toolbar = editorEl.value?.parentElement?.querySelector('.editor-toolbar')
  if (toolbar) {
    toolbar.addEventListener('mousedown', (e) => {
      e.preventDefault()
      // 保存选择范围
      saveSelection()
    }, true) // 使用捕获阶段，确保所有工具栏事件都被拦截
  }
})

onBeforeUnmount(() => {
  // noop
})
</script>

<template>
  <div class="forum-editor-container">
    <div class="editor-toolbar">
      <!-- 工具栏按钮统一添加mousedown事件，防止失去选择范围 -->
      <!-- 字号选择器 -->
      <div class="toolbar-group">
        <div class="custom-select">
          <button 
            class="select-toggle" 
            @click.stop="fontSizeMenuVisible = !fontSizeMenuVisible"
            @mousedown.stop.prevent="saveSelection()"
          >
            <i class="fas fa-text-height"></i>
            <span>字号</span>
            <i class="fas fa-caret-down"></i>
          </button>
          <div class="select-menu" v-if="fontSizeMenuVisible" @mousedown.stop.prevent>
            <div 
              v-for="o in sizeOptions" 
              :key="o.value"
              class="select-item"
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
          <button 
            class="select-toggle" 
            @click.stop="headingMenuVisible = !headingMenuVisible"
            @mousedown.stop.prevent="saveSelection()"
          >
            <i class="fas fa-heading"></i>
            <span>标题</span>
            <i class="fas fa-caret-down"></i>
          </button>
          <div class="select-menu" v-if="headingMenuVisible" @mousedown.stop.prevent>
            <div 
              v-for="o in headingOptions" 
              :key="o.value"
              class="select-item"
              @click.stop="() => { applyHeading(o.value); headingMenuVisible = false; }"
            >
              {{ o.label }}
            </div>
          </div>
        </div>
      </div>

      <el-button-group>
        <el-button 
          size="small" 
          title="粗体" 
          @click="exec('bold')"
          @mousedown.stop.prevent
        >
          <i class="fas fa-bold" />
        </el-button>
        <el-button 
          size="small" 
          title="斜体" 
          @click="exec('italic')"
          @mousedown.stop.prevent
        >
          <i class="fas fa-italic" />
        </el-button>
        <el-button 
          size="small" 
          title="下划线" 
          @click="exec('underline')"
          @mousedown.stop.prevent
        >
          <i class="fas fa-underline" />
        </el-button>
        <el-button 
          size="small" 
          title="删除线" 
          @click="exec('strikeThrough')"
          @mousedown.stop.prevent
        >
          <i class="fas fa-strikethrough" />
        </el-button>
      </el-button-group>

      <!-- 文字颜色选择器 -->
      <div class="toolbar-group editor-inline">
        <el-popover
          placement="bottom"
          trigger="click"
          @mousedown.stop.prevent
        >
          <template #reference>
            <el-button 
              size="small" 
              title="文字颜色"
              @mousedown.stop.prevent="saveSelection()"
              @click.stop="saveSelection()"
            >
              <i class="fas fa-palette" />
            </el-button>
          </template>
          <el-color-picker
            v-model="textColor"
            :show-alpha="false"
            @change="applyTextColor"
            size="small"
            @mousedown.stop.prevent
            @focus="saveSelection()"
          />
        </el-popover>
        
        <!-- 背景颜色选择器 -->
        <el-popover
          placement="bottom"
          trigger="click"
          @mousedown.stop.prevent
        >
          <template #reference>
            <el-button 
              size="small" 
              title="背景颜色"
              @mousedown.stop.prevent="saveSelection()"
              @click.stop="saveSelection()"
            >
              <i class="fas fa-fill-drip" />
            </el-button>
          </template>
          <el-color-picker
            v-model="bgColor"
            :show-alpha="false"
            @change="applyBgColor"
            size="small"
            @mousedown.stop.prevent
            @focus="saveSelection()"
          />
        </el-popover>
      </div>

      <el-button-group>
        <el-button 
          size="small" 
          title="左对齐" 
          @click="applyBlockClass('rt-align-left')"
          @mousedown.stop.prevent
        >
          <i class="fas fa-align-left" />
        </el-button>
        <el-button 
          size="small" 
          title="居中" 
          @click="applyBlockClass('rt-align-center')"
          @mousedown.stop.prevent
        >
          <i class="fas fa-align-center" />
        </el-button>
        <el-button 
          size="small" 
          title="右对齐" 
          @click="applyBlockClass('rt-align-right')"
          @mousedown.stop.prevent
        >
          <i class="fas fa-align-right" />
        </el-button>
      </el-button-group>

      <el-button-group>
        <el-button 
          size="small" 
          title="无序列表" 
          @click="exec('insertUnorderedList')"
          @mousedown.stop.prevent
        >
          <i class="fas fa-list-ul" />
        </el-button>
        <el-button 
          size="small" 
          title="有序列表" 
          @click="exec('insertOrderedList')"
          @mousedown.stop.prevent
        >
          <i class="fas fa-list-ol" />
        </el-button>
      </el-button-group>

      <el-button 
        size="small" 
        title="插入链接" 
        @click="insertLink"
        @mousedown.stop.prevent
      >
        <i class="fas fa-link" />
      </el-button>

      <el-popover
        v-model:visible="showImageUploader"
        placement="bottom"
        width="500px"
        trigger="click"
      >
        <template #reference>
          <el-button size="small" title="上传图片">
            <i class="fas fa-image" />
          </el-button>
        </template>
        <div class="image-uploader-container">
          <div class="uploader-header">
            <h3>上传图片</h3>
          </div>
          <div class="uploader-body">
            <div class="upload-area">
              <i class="fas fa-cloud-upload-alt" style="font-size: 32px; color: #909399;"></i>
              <p style="margin: 8px 0;">点击或拖拽上传图片</p>
              <p style="font-size: 12px; color: #909399;">最大300KB，支持JPG/PNG/GIF</p>
              <input 
                ref="fileInputRef"
                type="file" 
                accept="image/*" 
                style="display: none;" 
                @change="(e) => handleImageUpload(e.target.files?.[0])"
              />
              <button 
                class="upload-btn"
                @click.stop="fileInputRef?.click()"
              >
                选择文件
              </button>
            </div>
            
            <!-- 上传进度 -->
            <div v-if="uploadLoading" class="upload-progress">
              <div class="progress-info">
                <span>上传中...</span>
                <span>{{ uploadProgress }}%</span>
              </div>
              <el-progress :percentage="uploadProgress" :stroke-width="8" />
            </div>
            
            <!-- 已上传图片列表 -->
            <div v-if="uploadedImages.length > 0" class="uploaded-images">
              <h4>已上传图片</h4>
              <div class="image-list">
                <div 
                  v-for="(image, index) in uploadedImages" 
                  :key="image.id" 
                  class="image-item"
                >
                  <img :src="image.url" :alt="image.originalName" class="image-preview" />
                  <div class="image-name">{{ image.originalName }}</div>
                  <div class="image-actions">
                    <el-button 
                      type="primary" 
                      size="small" 
                      @click="insertImageToEditor(image)"
                    >
                      插入
                    </el-button>
                    <el-button 
                      type="danger" 
                      size="small" 
                      @click="deleteUploadedImage(index)"
                    >
                      删除
                    </el-button>
                  </div>
                </div>
              </div>
            </div>
          </div>
        </div>
      </el-popover>

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

/* 图片上传弹窗样式 */
.image-uploader-container {
  width: 100%;
  font-size: 14px;
}

.uploader-header {
  border-bottom: 1px solid #ebeef5;
  padding: 12px 0;
  margin-bottom: 16px;
}

.uploader-header h3 {
  margin: 0;
  font-size: 16px;
  font-weight: 600;
  color: #303133;
}

.uploader-body {
  padding: 0;
}

.upload-area {
  border: 2px dashed #dcdfe6;
  border-radius: 8px;
  padding: 32px 16px;
  text-align: center;
  transition: all 0.3s;
  margin-bottom: 16px;
  position: relative;
}

.upload-btn {
  background-color: #409eff;
  color: white;
  border: none;
  padding: 8px 16px;
  border-radius: 4px;
  cursor: pointer;
  font-size: 14px;
  margin-top: 16px;
  transition: background-color 0.3s;
}

.upload-btn:hover {
  background-color: #66b1ff;
}

.toolbar-group {
  display: inline-flex;
  align-items: center;
}

/* 自定义选择器样式 */
.custom-select {
  position: relative;
  display: inline-block;
}

.select-toggle {
  display: inline-flex;
  align-items: center;
  gap: 4px;
  background-color: white;
  border: 1px solid #dcdfe6;
  border-radius: 4px;
  padding: 6px 12px;
  cursor: pointer;
  font-size: 14px;
  color: #606266;
  transition: all 0.3s;
  min-width: 90px;
}

.select-toggle:hover {
  border-color: #409eff;
  color: #409eff;
}

.select-menu {
  position: absolute;
  top: 100%;
  left: 0;
  background-color: white;
  border: 1px solid #dcdfe6;
  border-radius: 4px;
  box-shadow: 0 2px 12px 0 rgba(0, 0, 0, 0.1);
  z-index: 1000;
  min-width: 120px;
  max-height: 200px;
  overflow-y: auto;
  margin-top: 4px;
}

.select-item {
  padding: 8px 12px;
  cursor: pointer;
  font-size: 14px;
  color: #606266;
  transition: background-color 0.3s;
}

.select-item:hover {
  background-color: #ecf5ff;
  color: #409eff;
}

.select-item:active {
  background-color: #e6f2ff;
}

/* 自定义选择器的图标样式 */
.select-toggle i {
  font-size: 14px;
}

/* 自定义选择器的文本样式 */
.select-toggle span {
  font-size: 14px;
}

/* 右箭头图标样式 */
.select-toggle i.fa-caret-down {
  font-size: 10px;
  margin-left: auto;
}

.upload-area:hover {
  border-color: #409eff;
  background-color: #ecf5ff;
}

.upload-progress {
  margin-bottom: 16px;
}

.progress-info {
  display: flex;
  justify-content: space-between;
  margin-bottom: 8px;
  font-size: 12px;
  color: #606266;
}

.uploaded-images {
  margin-top: 16px;
}

.uploaded-images h4 {
  margin: 0 0 12px 0;
  font-size: 14px;
  font-weight: 600;
  color: #303133;
}

.image-list {
  display: grid;
  grid-template-columns: repeat(auto-fill, minmax(120px, 1fr));
  gap: 12px;
}

.image-item {
  border: 1px solid #ebeef5;
  border-radius: 8px;
  overflow: hidden;
  padding: 8px;
  background-color: #fff;
  transition: all 0.3s;
}

.image-item:hover {
  box-shadow: 0 2px 12px 0 rgba(0, 0, 0, 0.1);
}

.image-preview {
  width: 100%;
  height: 80px;
  object-fit: cover;
  border-radius: 4px;
  margin-bottom: 8px;
}

.image-name {
  font-size: 12px;
  color: #606266;
  margin-bottom: 8px;
  white-space: nowrap;
  overflow: hidden;
  text-overflow: ellipsis;
}

.image-actions {
  display: flex;
  gap: 4px;
}

.image-actions .el-button {
  flex: 1;
  padding: 2px 4px;
  font-size: 12px;
  height: auto;
}

/* 响应式设计，支持移动端 */
@media (max-width: 768px) {
  .forum-editor-container {
    border-radius: 0;
    border: 1px solid var(--el-border-color);
  }
  
  .editor-toolbar {
    flex-wrap: wrap;
    gap: 4px;
    padding: 6px;
    overflow-x: auto;
    scrollbar-width: none;
    -webkit-overflow-scrolling: touch;
  }
  
  .editor-toolbar::-webkit-scrollbar {
    display: none;
  }
  
  .editor-upload-btn {
    width: 28px;
    height: 28px;
  }
  
  .editor-content {
    padding: 10px;
    font-size: 16px; /* 移动端字体稍大，提高可读性 */
  }
  
  .editor-content :deep(img.rt-emoji) {
    max-width: 60px;
    max-height: 60px;
  }
  
  .editor-content :deep(img.rt-image) {
    max-width: 100%;
  }
  
  /* 移动端工具栏按钮样式 */
  .editor-toolbar .el-button {
    padding: 6px;
    font-size: 14px;
    min-width: auto;
    height: 28px;
  }
  
  .editor-toolbar .el-select {
    width: auto !important;
    min-width: 80px;
  }
  
  /* 图片上传弹窗响应式 */
  .image-uploader-container {
    width: 100%;
    max-width: 100vw;
  }
  
  .image-list {
    grid-template-columns: repeat(auto-fill, minmax(80px, 1fr));
    gap: 8px;
  }
  
  .image-item {
    padding: 4px;
  }
  
  .image-preview {
    height: 60px;
  }
}

/* 触摸设备优化 */
@media (hover: none) and (pointer: coarse) {
  .editor-toolbar .el-button {
    min-height: 36px;
    font-size: 16px;
  }
  
  .editor-content {
    line-height: 1.8;
  }
}
</style>
