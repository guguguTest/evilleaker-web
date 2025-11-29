<!-- src/views/Forum.vue -->
<script setup>
import {computed, onMounted, reactive, ref} from 'vue';
import {
  getForumPosts,
  getForumPostDetail,
  createForumPost,
  createForumReply,
  getForumTags,
} from '@/api/forum';
import EmojiPicker from '@/components/EmojiPicker.vue';
import DOMPurify from 'dompurify';
import {showErrorMessage, showSuccessMessage} from '@/utils/messageBox';

const safeHtml = (html) =>
    DOMPurify.sanitize(html ?? '', {
      ALLOWED_TAGS: [
        'b','i','em','strong','a','br','p','ul','ol','li',
        'img','blockquote','code','pre','h1','h2','h3','span'
      ],
      ALLOWED_ATTR: ['href','target','rel','src','alt','title'],
    });

const SECTION_CONFIG = [
  { key: 'player', icon: 'fa-users', name: '玩家交流区', desc: '玩家之间的经验交流、闲聊' },
  { key: 'qa', icon: 'fa-question-circle', name: '问答区', desc: '提问与解答' },
  { key: 'official', icon: 'fa-bullhorn', name: '官方信息发布区', desc: '公告与官方说明' },
];

const activeSection = ref('player');
const posts = ref([]);
const postPage = ref(1);
const postLimit = ref(20);
const postsHasMore = ref(true);
const loadingPosts = ref(false);

const currentPost = ref(null);
const loadingPostDetail = ref(false);

const tags = ref([]);
const sectionTags = computed(() => tags.value.filter(t => t.section === activeSection.value));

const editorVisible = ref(false);
const editorMode = ref('create'); // 'create' | 'reply'
const editorForm = reactive({
  title: '',
  content: '',
  tag_id: null,
});

const loadingSubmit = ref(false);

function resetEditor() {
  editorForm.title = '';
  editorForm.content = '';
  editorForm.tag_id = null;
}

async function loadTags() {
  try {
    const data = await getForumTags();
    tags.value = data;
  } catch (e) {
    console.error(e);
  }
}

async function loadPosts(reset = false) {
  if (loadingPosts.value) return;
  if (reset) {
    postPage.value = 1;
    postsHasMore.value = true;
    posts.value = [];
  }
  if (!postsHasMore.value) return;

  loadingPosts.value = true;
  try {
    const res = await getForumPosts({
      section: activeSection.value,
      page: postPage.value,
      limit: postLimit.value,
    });

    if (reset) {
      posts.value = res.items || [];
    } else {
      posts.value = posts.value.concat(res.items || []);
    }
    postsHasMore.value = res.hasMore;
    postPage.value += 1;
  } catch (e) {
    console.error(e);
  } finally {
    loadingPosts.value = false;
  }
}

async function loadPostDetail(id) {
  loadingPostDetail.value = true;
  try {
    const data = await getForumPostDetail(id);
    currentPost.value = data;
  } catch (e) {
    console.error(e);
  } finally {
    loadingPostDetail.value = false;
  }
}

function openSection(key) {
  if (activeSection.value === key) return;
  activeSection.value = key;
  currentPost.value = null;
  loadPosts(true);
}

function openPost(post) {
  loadPostDetail(post.id);
}

function backToList() {
  currentPost.value = null;
}

function openCreatePost() {
  editorMode.value = 'create';
  resetEditor();
  editorVisible.value = true;
}

function openReply() {
  editorMode.value = 'reply';
  resetEditor();
  editorVisible.value = true;
}

function closeEditor() {
  editorVisible.value = false;
}

async function submitEditor() {
  if (!editorForm.content.trim()) {
    showErrorMessage('内容不能为空');
    return;
  }

  loadingSubmit.value = true;
  try {
    if (editorMode.value === 'create') {
      if (!editorForm.title.trim()) {
        showErrorMessage('标题不能为空');
        loadingSubmit.value = false;
        return;
      }
      await createForumPost({
        section: activeSection.value,
        title: editorForm.title,
        content: editorForm.content,
        tag_id: editorForm.tag_id,
      });
      showSuccessMessage('发表主题成功');
      loadPosts(true);
    } else {
      if (!currentPost.value) {
        showErrorMessage('当前帖子不存在');
        loadingSubmit.value = false;
        return;
      }
      await createForumReply(currentPost.value.id, {
        content: editorForm.content,
      });
      showSuccessMessage('回复成功');
      await loadPostDetail(currentPost.value.id);
    }

    editorVisible.value = false;
  } catch (e) {
    console.error(e);
    showErrorMessage('操作失败，请稍后重试');
  } finally {
    loadingSubmit.value = false;
  }
}

function onSelectEmoji(emoji) {
  editorForm.content += emoji.text || '';
}

function formatTime(time) {
  if (!time) return '';
  return new Date(time).toLocaleString();
}

onMounted(() => {
  loadTags();
  loadPosts(true);
});
</script>

<template>
  <div class="forum-page">
    <div class="forum-header">
      <h1 class="forum-title">
        <i class="fas fa-comments"></i>
        论坛交流区
      </h1>
      <p class="forum-subtitle">选择一个分区开始交流</p>
    </div>

    <div v-if="!currentPost" class="forum-main">
      <!-- 左侧分区卡片 -->
      <div class="forum-sections">
        <div
            v-for="section in SECTION_CONFIG"
            :key="section.key"
            class="section-card"
            :class="{ active: activeSection === section.key }"
            @click="openSection(section.key)"
        >
          <div class="section-icon">
            <i class="fas" :class="section.icon"></i>
          </div>
          <div class="section-info">
            <div class="section-name">{{ section.name }}</div>
            <div class="section-desc">{{ section.desc }}</div>
          </div>
        </div>
      </div>

      <!-- 右侧帖子列表 -->
      <div class="forum-content">
        <div class="forum-toolbar">
          <div class="toolbar-left">
            <div class="forum-tags" v-if="sectionTags.length">
              <span class="forum-tags-label">标签:</span>
              <span
                  v-for="tag in sectionTags"
                  :key="tag.id"
                  class="forum-tag"
              >
                {{ tag.tag_name }}
              </span>
            </div>
          </div>
          <div class="toolbar-right">
            <button class="forum-btn forum-btn-primary" @click="openCreatePost">
              <i class="fas fa-pen"></i>
              发表主题
            </button>
          </div>
        </div>

        <div class="forum-posts">
          <div v-if="loadingPosts" class="forum-loading">
            <i class="fas fa-spinner fa-spin"></i>
            <p>加载中...</p>
          </div>
          <div v-else-if="!posts.length" class="forum-empty">
            暂无帖子
          </div>
          <div v-else>
            <div
                v-for="post in posts"
                :key="post.id"
                class="forum-post-card"
                @click="openPost(post)"
            >
              <div class="forum-post-title">{{ post.title }}</div>
              <div class="forum-post-meta">
                <span>{{ post.author_nickname || post.author_username }}</span>
                <span>{{ formatTime(post.created_at) }}</span>
                <span v-if="post.reply_count">
                  回复: {{ post.reply_count }}
                </span>
              </div>
              <div class="forum-post-excerpt">
                {{ post.excerpt }}
              </div>
              <div class="forum-post-tags">
                <span
                    v-for="tag in post.tags || []"
                    :key="tag.id"
                    class="forum-post-tag"
                >
                  {{ tag.tag_name }}
                </span>
              </div>
            </div>

            <div class="forum-load-more" v-if="postsHasMore">
              <button
                  class="forum-btn forum-btn-secondary"
                  @click="loadPosts()"
                  :disabled="loadingPosts"
              >
                加载更多
              </button>
            </div>
          </div>
        </div>
      </div>
    </div>

    <!-- 帖子详情 -->
    <div v-else class="forum-detail">
      <div class="forum-detail-header">
        <button class="forum-btn forum-btn-secondary" @click="backToList">
          <i class="fas fa-arrow-left"></i>
          返回列表
        </button>
      </div>

      <div class="forum-detail-main">
        <div class="forum-post-detail">
          <h2 class="forum-post-title-detail">{{ currentPost.title }}</h2>
          <div class="forum-post-meta-detail">
            <span>{{ currentPost.author_nickname || currentPost.author_username }}</span>
            <span>{{ formatTime(currentPost.created_at) }}</span>
          </div>
          <div class="forum-post-content" v-html="safeHtml(currentPost.content)"></div>
        </div>

        <div class="forum-replies">
          <h3 class="reply-title">
            <i class="fas fa-comments"></i>
            回复
          </h3>
          <div v-if="loadingPostDetail" class="forum-loading">
            <i class="fas fa-spinner fa-spin"></i>
            加载中...
          </div>
          <div v-else-if="!currentPost.replies || !currentPost.replies.length" class="forum-empty">
            暂无回复
          </div>
          <div v-else class="forum-reply-list">
            <div
                v-for="reply in currentPost.replies"
                :key="reply.id"
                class="forum-reply-item"
            >
              <div class="reply-header">
                <span class="author">{{ reply.nickname || reply.username }}</span>
                <span class="time">{{ formatTime(reply.created_at) }}</span>
              </div>
              <div class="reply-content" v-html="safeHtml(reply.content)"></div>
            </div>
          </div>

          <div class="forum-reply-editor">
            <h3 class="reply-title">
              <i class="fas fa-pen"></i>
              发表回复
            </h3>
            <div class="editor-toolbar">
              <EmojiPicker @select="onSelectEmoji" />
            </div>
            <div
                class="editor-content"
                contenteditable="true"
                v-html="safeHtml(editorForm.content)"
                @input="editorForm.content = DOMPurify.sanitize($event.target.innerHTML)"
            ></div>
            <div class="editor-actions">
              <button class="forum-btn forum-btn-primary" @click="openReply">
                使用弹窗编辑
              </button>
            </div>
          </div>
        </div>
      </div>
    </div>

    <!-- 发帖 / 回复弹窗 -->
    <div v-if="editorVisible" class="forum-editor-modal">
      <div class="forum-editor-dialog">
        <div class="forum-editor-header">
          <span>{{ editorMode === 'create' ? '发表主题' : '回复帖子' }}</span>
          <button class="forum-editor-close" @click="closeEditor">
            <i class="fas fa-times"></i>
          </button>
        </div>
        <div class="forum-editor-body">
          <div v-if="editorMode === 'create'" class="editor-field">
            <label>标题</label>
            <input
                v-model="editorForm.title"
                class="editor-input"
                placeholder="请输入标题"
            />
          </div>
          <div v-if="editorMode === 'create'" class="editor-field">
            <label>标签</label>
            <select v-model="editorForm.tag_id" class="editor-input">
              <option
                  v-for="tag in sectionTags"
                  :key="tag.id"
                  :value="tag.id"
              >
                {{ tag.tag_name }}
              </option>
            </select>
          </div>
          <div class="editor-field">
            <label>内容</label>
            <div class="editor-toolbar">
              <EmojiPicker @select="onSelectEmoji" />
            </div>
            <div
                class="editor-content"
                contenteditable="true"
                v-html="safeHtml(editorForm.content)"
                @input="editorForm.content = DOMPurify.sanitize($event.target.innerHTML)"
            ></div>
          </div>
        </div>
        <div class="forum-editor-footer">
          <button
              class="forum-btn forum-btn-secondary"
              @click="closeEditor"
              :disabled="loadingSubmit"
          >
            取消
          </button>
          <button
              class="forum-btn forum-btn-primary"
              @click="submitEditor"
              :disabled="loadingSubmit"
          >
            {{ loadingSubmit ? '提交中...' : '提交' }}
          </button>
        </div>
      </div>
    </div>
  </div>
</template>

<style scoped>
.forum-page {
  max-width: 1120px;
  margin: 0 auto;
  padding: 16px;
}

.forum-header {
  margin-bottom: 16px;
}

.forum-title {
  font-size: 22px;
  font-weight: 700;
  display: flex;
  align-items: center;
  gap: 8px;
}

.forum-title i {
  color: #6366f1;
}

.forum-subtitle {
  margin-top: 4px;
  color: #6b7280;
}

/* 主布局 */
.forum-main {
  display: grid;
  grid-template-columns: 280px 1fr;
  gap: 16px;
}

/* 分区卡片 */
.forum-sections {
  display: flex;
  flex-direction: column;
  gap: 10px;
}

.section-card {
  border-radius: 12px;
  padding: 10px 12px;
  background: #f9fafb;
  display: flex;
  gap: 10px;
  cursor: pointer;
  transition: all 0.2s;
  border: 1px solid transparent;
}

.section-card:hover {
  background: #eef2ff;
  border-color: #c7d2fe;
}

.section-card.active {
  background: #e0e7ff;
  border-color: #6366f1;
}

.section-icon {
  width: 32px;
  height: 32px;
  border-radius: 999px;
  display: flex;
  align-items: center;
  justify-content: center;
  background: #e5e7eb;
  color: #4b5563;
}

.section-info {
  flex: 1;
}

.section-name {
  font-weight: 600;
  margin-bottom: 2px;
}

.section-desc {
  font-size: 13px;
  color: #6b7280;
}

/* 帖子列表 */
.forum-content {
  border-radius: 12px;
  background: #fff;
  border: 1px solid #e5e7eb;
  padding: 10px 12px;
}

.forum-toolbar {
  display: flex;
  justify-content: space-between;
  align-items: center;
  margin-bottom: 8px;
}

.forum-tags {
  display: flex;
  align-items: center;
  gap: 4px;
  flex-wrap: wrap;
}

.forum-tags-label {
  font-size: 13px;
  color: #6b7280;
}

.forum-tag {
  border-radius: 999px;
  background: #eef2ff;
  color: #4f46e5;
  padding: 2px 8px;
  font-size: 12px;
}

/* 按钮 */
.forum-btn {
  border-radius: 999px;
  padding: 6px 12px;
  border: none;
  cursor: pointer;
  font-size: 13px;
  display: inline-flex;
  align-items: center;
  gap: 6px;
}

.forum-btn-primary {
  background: linear-gradient(135deg, #6366f1, #8b5cf6);
  color: #fff;
}

.forum-btn-secondary {
  background: #e5e7eb;
  color: #374151;
}

.forum-posts {
  margin-top: 4px;
}

.forum-loading {
  padding: 40px 20px;
  text-align: center;
  color: #6b7280;
}

.forum-empty {
  padding: 40px 20px;
  text-align: center;
  color: #6b7280;
}

.forum-post-card {
  border-radius: 10px;
  padding: 8px 10px;
  border: 1px solid #e5e7eb;
  cursor: pointer;
  margin-bottom: 8px;
  background: #fff;
}

.forum-post-card:hover {
  border-color: #a5b4fc;
  background: #f9fafb;
}

.forum-post-title {
  font-weight: 600;
}

.forum-post-meta {
  display: flex;
  flex-wrap: wrap;
  gap: 6px;
  font-size: 12px;
  color: #6b7280;
  margin-top: 4px;
}

.forum-post-excerpt {
  margin-top: 4px;
  font-size: 13px;
  color: #4b5563;
}

.forum-post-tags {
  margin-top: 6px;
}

.forum-post-tag {
  border-radius: 999px;
  background: #f3e8ff;
  color: #7c3aed;
  padding: 2px 8px;
  font-size: 12px;
  margin-right: 4px;
}

.forum-load-more {
  text-align: center;
  margin-top: 8px;
}

/* 详情页 */
.forum-detail {
  border-radius: 12px;
  background: #fff;
  border: 1px solid #e5e7eb;
  padding: 10px 12px;
}

.forum-detail-header {
  margin-bottom: 8px;
}

.forum-detail-main {
  display: grid;
  grid-template-columns: minmax(0, 3fr) minmax(0, 2fr);
  gap: 16px;
}

.forum-post-detail {
  border-radius: 10px;
  background: #f9fafb;
  padding: 10px 12px;
}

.forum-post-title-detail {
  font-size: 18px;
  font-weight: 700;
  margin-bottom: 4px;
}

.forum-post-meta-detail {
  font-size: 12px;
  color: #6b7280;
  margin-bottom: 8px;
}

.forum-post-content {
  font-size: 14px;
  color: #111827;
  line-height: 1.6;
}

/* 回复 */
.forum-replies {
  border-radius: 10px;
  background: #f9fafb;
  padding: 10px 12px;
}

.reply-title {
  font-size: 15px;
  font-weight: 600;
  margin-bottom: 8px;
  display: flex;
  align-items: center;
  gap: 6px;
}

.forum-reply-list {
  display: flex;
  flex-direction: column;
  gap: 8px;
}

.forum-reply-item {
  border-radius: 10px;
  background: #fff;
  border: 1px solid #e5e7eb;
  padding: 6px 8px;
}

.reply-header {
  display: flex;
  justify-content: space-between;
  font-size: 12px;
  color: #6b7280;
  margin-bottom: 4px;
}

.reply-content {
  font-size: 13px;
  color: #111827;
}

/* 回复编辑 */
.forum-reply-editor {
  margin-top: 12px;
}

.editor-toolbar {
  margin-bottom: 4px;
}

.editor-content {
  min-height: 80px;
  border-radius: 8px;
  border: 1px solid #d1d5db;
  padding: 6px 8px;
  background: #fff;
  font-size: 13px;
  outline: none;
}

.editor-actions {
  margin-top: 6px;
  text-align: right;
}

/* 弹窗 */
.forum-editor-modal {
  position: fixed;
  inset: 0;
  background: rgba(15, 23, 42, 0.45);
  z-index: 1400;
  display: flex;
  align-items: center;
  justify-content: center;
}

.forum-editor-dialog {
  width: 580px;
  max-width: 95vw;
  max-height: 90vh;
  background: #fff;
  border-radius: 14px;
  box-shadow: 0 20px 45px rgba(15, 23, 42, 0.4);
  display: flex;
  flex-direction: column;
}

.forum-editor-header {
  padding: 8px 12px;
  border-bottom: 1px solid #e5e7eb;
  display: flex;
  justify-content: space-between;
  align-items: center;
}

.forum-editor-body {
  padding: 8px 12px;
  overflow-y: auto;
}

.forum-editor-footer {
  padding: 8px 12px;
  border-top: 1px solid #e5e7eb;
  display: flex;
  justify-content: flex-end;
  gap: 8px;
}

.forum-editor-close {
  border-radius: 999px;
  width: 26px;
  height: 26px;
  border: none;
  background: #e5e7eb;
  cursor: pointer;
}

/* 表单 */
.editor-field {
  margin-bottom: 8px;
}

.editor-field label {
  font-size: 13px;
  display: block;
  margin-bottom: 4px;
}

.editor-input {
  width: 100%;
  border-radius: 8px;
  border: 1px solid #d1d5db;
  padding: 6px 8px;
  font-size: 13px;
}

/* 可以继续将 forum.css 中的 .forum- 开头样式复制过来保证 1:1 */
</style>
