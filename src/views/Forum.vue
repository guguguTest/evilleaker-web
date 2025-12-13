<!-- src/views/Forum.vue -->
<script setup>
import { computed, onMounted, reactive, ref, watch } from 'vue'
import DOMPurify from 'dompurify'
import { ElMessageBox } from 'element-plus'
import {
  acceptReply,
  closePost,
  createForumPost,
  createForumReply,
  deleteForumReply,
  getForumPostDetail,
  getForumPosts,
  getForumTags,
  updateForumPost,
} from '@/api/forum'
import { showErrorMessage, showSuccessMessage } from '@/utils/messageBox'
import { useAuthStore } from '@/stores/auth'
import { baseUrl } from '@/api/base'
import { joinUrl } from '@/utils/misc'
import ForumRichEditor from '@/components/forum/ForumRichEditor.vue'

const auth = useAuthStore()

const SECTION_CONFIG = [
  { key: 'player', name: '玩家交流区', desc: '自由交流游戏心得、分享经验', icon: 'fas fa-users' },
  { key: 'qa', name: '问答区', desc: '提问与解答', icon: 'fas fa-question-circle' },
  { key: 'official', name: '官方信息发布区', desc: '公告与官方说明', icon: 'fas fa-bullhorn' },
]

const activeSection = ref('player')
const keyword = ref('')
const tagId = ref(null)

const tags = ref([])
const posts = ref([])
const pagination = reactive({
  page: 1,
  limit: 20,
  total: 0,
})
const loadingPosts = ref(false)
const canPost = ref(false)

const currentPostId = ref(null)
const postDetail = ref(null) // { post, replies }
const loadingPostDetail = ref(false)

const isAdmin = computed(() => Number(auth.user?.user_rank || 0) >= 5)
const currentUserId = computed(() => Number(auth.user?.id || 0))

const sectionTags = computed(() => tags.value)

// =============== 渲染：token -> HTML，然后统一 DOMPurify ===============

function toImgUrl (p) {
  if (!p) return ''
  return p.startsWith('http') ? p : joinUrl(baseUrl, p)
}

function renderTokens (html) {
  if (!html) return ''

  let out = String(html)

  // [emoji:id:/path(:/audio)]
  out = out.replace(/\[emoji:(\d+):([^\]:]+)(?::([^\]]+))?\]/g, (_m, id, imgPath, audioPath) => {
    const src = toImgUrl(imgPath.trim())
    const audio = audioPath ? toImgUrl(audioPath.trim()) : ''
    return `<img class="emoji-message-img" data-emoji-id="${id}" ${audio ? `data-audio-path="${audio}"` : ''} src="${src}" alt="emoji" />`
  })

  // [image:/uploads/image/forum/xxx.png]
  out = out.replace(/\[image:([^\]]+?)\]/g, (_m, path) => {
    const src = toImgUrl(path.trim())
    return `<img class="forum-uploaded-image" src="${src}" alt="image" />`
  })

  // @mention（避免在标签内部误伤：这里只处理纯文本区域较难；最终仍由 DOMPurify 兜底）
  out = out.replace(/(^|[\s>])@([^\s@<]+)/g, (_m, p1, name) => {
    return `${p1}<span class="mention">@${name}</span>`
  })

  return out
}

function safeHtml (html) {
  return DOMPurify.sanitize(renderTokens(html), {
    ALLOWED_TAGS: [
      'p','br','b','strong','i','em','u','s',
      'ul','ol','li','blockquote','span','code','pre',
      'h1','h2','h3','h4','h5','h6',
      'a','img',
    ],
    ALLOWED_ATTR: [
      'href','target','rel','src','alt','title','class',
      'data-audio-path','data-emoji-id',
    ],
  })
}

function formatTime (t) {
  if (!t) return ''
  const d = new Date(t)
  return d.toLocaleString()
}

// =============== 数据加载 ===============

async function loadTagsForSection () {
  try {
    tags.value = await getForumTags(activeSection.value)
  } catch (e) {
    console.error('loadTags error', e)
    tags.value = []
  }
}

async function loadPosts () {
  if (loadingPosts.value) return
  loadingPosts.value = true
  try {
    const res = await getForumPosts(activeSection.value, {
      page: pagination.page,
      limit: pagination.limit,
      keyword: keyword.value || '',
      tag_id: tagId.value || undefined,
    })

    // 后端返回：{ posts, pagination, userInfo }
    posts.value = res?.posts || []
    pagination.total = Number(res?.pagination?.totalItems || 0)
    canPost.value = !!res?.userInfo?.canPost
  } catch (e) {
    console.error('loadPosts error', e)
    posts.value = []
    pagination.total = 0
  } finally {
    loadingPosts.value = false
  }
}

async function openPost (postId) {
  currentPostId.value = postId
  // 清理草稿，避免跨帖串内容
  form.content = ''
  loadingPostDetail.value = true
  try {
    postDetail.value = await getForumPostDetail(postId)
  } catch (e) {
    console.error('loadPostDetail error', e)
    showErrorMessage('加载帖子失败')
    currentPostId.value = null
  } finally {
    loadingPostDetail.value = false
  }
}

function backToList () {
  currentPostId.value = null
  postDetail.value = null
  // 详情页打开时已写入阅读记录，返回后刷新列表（让未读红点消失）
  pagination.page = 1
  loadPosts()
}

function switchSection (key) {
  if (activeSection.value === key) return
  activeSection.value = key
  keyword.value = ''
  tagId.value = null
  pagination.page = 1
  currentPostId.value = null
  postDetail.value = null
}

watch(activeSection, async () => {
  await loadTagsForSection()
  await loadPosts()
})

watch(() => pagination.limit, async () => {
  pagination.page = 1
  await loadPosts()
})

// =============== 发帖 / 回帖 / 编辑 ===============

const dialog = reactive({
  visible: false,
  mode: 'create', // create | reply | edit
  loading: false,
})

const form = reactive({
  title: '',
  tag_id: null,
  content: '',
})

function openCreateDialog () {
  dialog.mode = 'create'
  form.title = ''
  form.tag_id = null
  form.content = ''
  dialog.visible = true
}

function openReplyDialog () {
  dialog.mode = 'reply'
  form.title = ''
  form.tag_id = null
  dialog.visible = true
}

function openEditPostDialog () {
  const post = postDetail.value?.post
  if (!post) return
  dialog.mode = 'edit'
  form.title = post.title || ''
  form.tag_id = post.tag_id || null
  form.content = post.content || ''
  dialog.visible = true
}

const canEditCurrentPost = computed(() => {
  const post = postDetail.value?.post
  if (!post) return false
  return isAdmin.value || Number(post.user_id) === currentUserId.value
})

async function submitDialog () {
  if (!form.content.trim()) {
    showErrorMessage('内容不能为空')
    return
  }
  if (dialog.mode !== 'reply' && !String(form.title || '').trim()) {
    showErrorMessage('标题不能为空')
    return
  }

  dialog.loading = true
  try {
    if (dialog.mode === 'create') {
      await createForumPost(activeSection.value, {
        title: form.title,
        content: form.content,
        tag_id: form.tag_id || null,
      })
      showSuccessMessage('发帖成功')
      dialog.visible = false
      pagination.page = 1
      await loadPosts()
      return
    }

    if (dialog.mode === 'edit') {
      const postId = postDetail.value?.post?.id
      if (!postId) return
      await updateForumPost(postId, {
        title: form.title,
        content: form.content,
        tag_id: form.tag_id || null,
      })
      showSuccessMessage('更新成功')
      dialog.visible = false
      await openPost(postId)
      return
    }

    // reply
    const postId = postDetail.value?.post?.id
    if (!postId) return
    await createForumReply(postId, { content: form.content })
    showSuccessMessage('回复成功')
    dialog.visible = false
    await openPost(postId)
  } catch (e) {
    console.error(e)
    showErrorMessage(e?.error || e?.message || '操作失败')
  } finally {
    dialog.loading = false
  }
}

async function onDeleteReply (replyId) {
  try {
    await ElMessageBox.confirm('确定删除此回复吗？', '提示', { type: 'warning' })
    await deleteForumReply(replyId)
    showSuccessMessage('已删除')
    await openPost(postDetail.value?.post?.id)
  } catch (_e) {
    // cancel
  }
}

async function onAcceptReply (replyId) {
  try {
    await ElMessageBox.confirm('确定采纳此回复吗？采纳后将结贴并发放悬赏（如有）。', '采纳答案', { type: 'warning' })
    const postId = postDetail.value?.post?.id
    if (!postId) return
    await acceptReply(postId, replyId)
    showSuccessMessage('已采纳')
    await openPost(postId)
  } catch (_e) {
    // cancel
  }
}

async function onClosePost () {
  try {
    await ElMessageBox.confirm('确定结贴吗？结贴后将无法继续回复。', '结贴', { type: 'warning' })
    const postId = postDetail.value?.post?.id
    if (!postId) return
    await closePost(postId)
    showSuccessMessage('已结贴')
    await openPost(postId)
  } catch (_e) {
    // cancel
  }
}

// =============== 初始化 ===============

onMounted(async () => {
  await auth.init()
  await loadTagsForSection()
  await loadPosts()
})
</script>

<template>
  <div class="forum-container">
    <div class="forum-header">
      <h1 class="forum-title"><i class="fas fa-comments" /> 交流区</h1>
      <p class="forum-subtitle">左侧选择分区，右侧浏览帖子</p>
    </div>

    <!-- 列表页：左侧分区 + 右侧帖子列表 -->
    <div v-if="!currentPostId" class="forum-layout" style="display:flex; gap:16px;">
      <div style="width:320px; flex:0 0 320px;">
        <div class="section-grid" style="grid-template-columns: 1fr; margin-top: 0;">
          <div
            v-for="s in SECTION_CONFIG"
            :key="s.key"
            class="section-card"
            :class="s.key"
            style="padding: 18px;"
            @click="switchSection(s.key)"
          >
            <div class="section-icon"><i :class="s.icon" /></div>
            <div class="section-name">{{ s.name }}</div>
            <div class="section-desc">{{ s.desc }}</div>
          </div>
        </div>
      </div>

      <div style="flex:1; min-width:0;">
        <div class="forum-toolbar">
          <div class="toolbar-left">
            <el-input
              v-model="keyword"
              placeholder="搜索标题/内容"
              clearable
              style="width: 260px"
              @keyup.enter="() => { pagination.page = 1; loadPosts(); }"
              @clear="() => { pagination.page = 1; loadPosts(); }"
            />

            <el-select
              v-model="tagId"
              clearable
              placeholder="标签筛选"
              style="width: 180px"
              @change="() => { pagination.page = 1; loadPosts(); }"
            >
              <el-option
                v-for="t in sectionTags"
                :key="t.id"
                :label="t.tag_name"
                :value="t.id"
              />
            </el-select>

            <el-select v-model="pagination.limit" style="width: 140px" placeholder="每页条数">
              <el-option :value="20" label="20 / 页" />
              <el-option :value="50" label="50 / 页" />
              <el-option :value="100" label="100 / 页" />
            </el-select>
          </div>

          <div class="toolbar-right">
            <button
              class="forum-btn forum-btn-primary"
              :disabled="!canPost"
              @click="openCreateDialog"
              :title="canPost ? '' : '当前分区发帖权限不足'"
            >
              <i class="fas fa-plus-circle" />
              发布主题
            </button>
          </div>
        </div>

        <div class="post-list" id="post-list-container">
          <div v-if="loadingPosts" class="forum-loading"><div class="forum-spinner" /></div>

          <div v-else-if="!posts.length" class="empty-state">
            <i class="fas fa-inbox" />
            <p>暂无帖子</p>
          </div>

          <div v-else>
            <div
              v-for="p in posts"
              :key="p.id"
              class="post-item"
              :class="{ 'post-pinned': (p.pin_level||0) > 0, 'post-unread': !!p.is_unread }"
              @click="openPost(p.id)"
            >
              <img :src="p.avatar" class="post-avatar" alt="avatar" />

              <div class="post-info">
                <div class="post-title-row">
                  <span v-if="p.is_unread" class="unread-indicator" />
                  <span class="post-title" :class="{ 'post-title-unread': !!p.is_unread }">{{ p.title }}</span>
                  <span
                    v-if="p.tag_name"
                    class="post-tag"
                    :style="{ background: p.tag_color, color: p.text_color }"
                  >{{ p.tag_name }}</span>
                </div>
                <div class="post-meta">
                  <span>{{ p.author_name }}</span>
                  <span>•</span>
                  <span>{{ formatTime(p.created_at) }}</span>
                </div>
              </div>

              <div class="post-stat"><i class="fas fa-eye" /> {{ p.view_count || 0 }}</div>
              <div class="post-stat"><i class="fas fa-comment" /> {{ p.reply_count || 0 }}</div>
            </div>
          </div>
        </div>

        <div style="margin-top: 12px; display:flex; justify-content:flex-end;">
          <el-pagination
            background
            layout="total, sizes, prev, pager, next"
            :total="pagination.total"
            v-model:current-page="pagination.page"
            v-model:page-size="pagination.limit"
            :page-sizes="[20,50,100]"
            @current-change="loadPosts"
            @size-change="() => { pagination.page = 1; loadPosts(); }"
          />
        </div>
      </div>
    </div>

    <!-- 详情页 -->
    <div v-else class="forum-container" style="padding:0;">
      <div class="forum-header" style="margin-bottom: 20px;">
        <button class="forum-btn forum-btn-secondary" @click="backToList">
          <i class="fas fa-arrow-left" /> 返回列表
        </button>
      </div>

      <div v-if="loadingPostDetail" class="forum-loading"><div class="forum-spinner" /></div>

      <template v-else>
        <div class="post-detail-header">
          <div class="post-detail-title">{{ postDetail?.post?.title }}</div>
          <div class="post-detail-meta">
            <span v-if="postDetail?.post?.tag_name" class="post-tag" :style="{ background: postDetail.post.tag_color, color: postDetail.post.text_color }">
              {{ postDetail.post.tag_name }}
            </span>
            <span><i class="fas fa-user" /> {{ postDetail?.post?.author_name }}</span>
            <span><i class="fas fa-clock" /> {{ formatTime(postDetail?.post?.created_at) }}</span>
            <span><i class="fas fa-eye" /> {{ postDetail?.post?.view_count || 0 }}</span>
            <span><i class="fas fa-comment" /> {{ postDetail?.post?.reply_count || 0 }}</span>
          </div>

          <div class="post-detail-toolbar">
            <button
              v-if="canEditCurrentPost"
              class="forum-btn forum-btn-secondary forum-btn-sm"
              @click="openEditPostDialog"
            >
              <i class="fas fa-edit" /> 编辑
            </button>
            <button
              v-if="postDetail?.post?.section_key === 'qa' && (Number(postDetail?.post?.user_id) === currentUserId) && !postDetail?.post?.is_closed && !postDetail?.post?.is_solved"
              class="forum-btn forum-btn-warning forum-btn-sm"
              @click="onClosePost"
            >
              <i class="fas fa-times-circle" /> 结贴
            </button>
          </div>
        </div>

        <div class="reply-list" id="reply-list">
          <!-- 楼主内容 -->
          <div class="reply-item" id="floor-0">
            <div class="reply-author">
              <img :src="postDetail?.post?.avatar" class="reply-author-avatar" alt="avatar" />
              <div class="reply-author-name">{{ postDetail?.post?.author_name }}</div>
              <div class="reply-author-rank">UID: {{ postDetail?.post?.uid || postDetail?.post?.user_id }}</div>
            </div>
            <div class="reply-content-wrapper">
              <div class="reply-meta">
                <span class="reply-floor op">楼主</span>
                <span>{{ formatTime(postDetail?.post?.created_at) }}</span>
              </div>
              <div class="reply-content" v-html="safeHtml(postDetail?.post?.content)" />
            </div>
          </div>

          <!-- 回复楼层 -->
          <div
            v-for="r in postDetail?.replies || []"
            :key="r.id"
            class="reply-item"
            :id="`floor-${r.floor_number}`"
          >
            <div class="reply-author">
              <img :src="r.avatar" class="reply-author-avatar" alt="avatar" />
              <div class="reply-author-name">{{ r.author_name }}</div>
              <div class="reply-author-rank">UID: {{ r.uid || r.user_id }}</div>
            </div>
            <div class="reply-content-wrapper">
              <div class="reply-meta">
                <span class="reply-floor">#{{ r.floor_number }}</span>
                <span>{{ formatTime(r.created_at) }}</span>
              </div>
              <div class="reply-content" v-html="safeHtml(r.content)" />

              <div class="reply-actions" v-if="isAdmin || Number(r.user_id) === currentUserId || (postDetail?.post?.section_key==='qa' && Number(postDetail?.post?.user_id)===currentUserId && !postDetail?.post?.is_closed && !postDetail?.post?.is_solved)">
                <button
                  v-if="postDetail?.post?.section_key==='qa' && Number(postDetail?.post?.user_id)===currentUserId && !postDetail?.post?.is_closed && !postDetail?.post?.is_solved"
                  class="forum-btn forum-btn-success forum-btn-sm"
                  @click="onAcceptReply(r.id)"
                >
                  <i class="fas fa-check-circle" /> 采纳
                </button>
                <button
                  v-if="isAdmin || Number(r.user_id) === currentUserId"
                  class="forum-btn forum-btn-danger forum-btn-sm"
                  @click="onDeleteReply(r.id)"
                >
                  <i class="fas fa-trash" /> 删除
                </button>
              </div>
            </div>
          </div>
        </div>

        <div class="reply-input-area" v-if="!postDetail?.post?.is_closed && (!postDetail?.post?.reply_disabled || isAdmin)">
          <div class="reply-input-title"><i class="fas fa-reply" /> 发表回复</div>
          <ForumRichEditor v-model="form.content" placeholder="请输入回复内容…" />
          <div style="margin-top: 12px; text-align: right;">
            <button class="forum-btn forum-btn-primary" @click="openReplyDialog">
              <i class="fas fa-pen" /> 在弹窗中编辑并发布
            </button>
          </div>
        </div>
      </template>
    </div>

    <!-- 编辑弹窗（Element Plus 风格） -->
    <el-dialog
      v-model="dialog.visible"
      :title="dialog.mode === 'create' ? '发布主题' : (dialog.mode === 'edit' ? '编辑帖子' : '发表回复')"
      width="860px"
      :close-on-click-modal="false"
    >
      <el-form label-width="80px">
        <el-form-item v-if="dialog.mode !== 'reply'" label="标题">
          <el-input v-model="form.title" maxlength="100" show-word-limit />
        </el-form-item>

        <el-form-item v-if="dialog.mode !== 'reply'" label="标签">
          <el-select v-model="form.tag_id" clearable placeholder="请选择标签" style="width: 260px">
            <el-option v-for="t in sectionTags" :key="t.id" :value="t.id" :label="t.tag_name" />
          </el-select>
        </el-form-item>

        <el-form-item label="内容">
          <ForumRichEditor v-model="form.content" />
        </el-form-item>
      </el-form>

      <template #footer>
        <el-button @click="dialog.visible = false" :disabled="dialog.loading">取消</el-button>
        <el-button type="primary" @click="submitDialog" :loading="dialog.loading">提交</el-button>
      </template>
    </el-dialog>
  </div>
</template>

<!-- 论坛整体样式由 src/assets/css/forum.css 提供，这里不做 scoped 覆盖 -->
