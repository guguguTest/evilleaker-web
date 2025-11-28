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
import {showErrorMessage, showSuccessMessage} from '@/utils/messageBox';

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
const sectionTags = computed(() =>
    tags.value.filter(t => t.section_key === activeSection.value),
);

const editorVisible = ref(false);
const editorMode = ref('create'); // create / reply
const editorForm = reactive({
  title: '',
  content: '',
  tag_id: null,
});

async function loadTags() {
  const res = await getForumTags();
  tags.value = res;
}

async function loadPosts(reset = false) {
  if (loadingPosts.value) return;
  if (reset) {
    postPage.value = 1;
    posts.value = [];
    postsHasMore.value = true;
  }
  if (!postsHasMore.value && !reset) return;

  loadingPosts.value = true;
  try {
    const res = await getForumPosts(activeSection.value, {
      page: postPage.value,
      limit: postLimit.value,
    });
    if (!Array.isArray(res) || res.length < postLimit.value) {
      postsHasMore.value = false;
    }
    posts.value = reset ? res : [...posts.value, ...res];
    postPage.value += 1;
  } catch (e) {
    showErrorMessage('加载帖子失败');
  } finally {
    loadingPosts.value = false;
  }
}

async function openSection(sectionKey) {
  activeSection.value = sectionKey;
  currentPost.value = null;
  await loadPosts(true);
}

async function openPost(post) {
  loadingPostDetail.value = true;
  currentPost.value = null;
  try {
    const res = await getForumPostDetail(post.id);
    currentPost.value = res;
  } catch (e) {
    showErrorMessage('加载帖子详情失败');
  } finally {
    loadingPostDetail.value = false;
  }
}

function openCreatePost() {
  editorMode.value = 'create';
  editorVisible.value = true;
  editorForm.title = '';
  editorForm.content = '';
  editorForm.tag_id = sectionTags.value[0]?.id || null;
}

function openReply() {
  editorMode.value = 'reply';
  editorVisible.value = true;
  editorForm.content = '';
}

function closeEditor() {
  editorVisible.value = false;
}

async function submitEditor() {
  try {
    if (editorMode.value === 'create') {
      if (!editorForm.title.trim() || !editorForm.content.trim()) {
        showErrorMessage('标题和内容不能为空');
        return;
      }
      await createForumPost(activeSection.value, {
        title: editorForm.title,
        content: editorForm.content,
        tag_id: editorForm.tag_id,
      });
      showSuccessMessage('发帖成功');
      closeEditor();
      await loadPosts(true);
    } else if (editorMode.value === 'reply') {
      if (!currentPost.value) return;
      if (!editorForm.content.trim()) {
        showErrorMessage('内容不能为空');
        return;
      }
      await createForumReply(currentPost.value.id, {
        content: editorForm.content,
      });
      showSuccessMessage('回复成功');
      closeEditor();
      await openPost(currentPost.value);
    }
  } catch (e) {
    showErrorMessage('提交失败');
  }
}

function onSelectEmoji(emoji) {
  const text = emoji.text || '';
  editorForm.content += text;
}

function formatTime(time) {
  if (!time) return '';
  return new Date(time).toLocaleString();
}

onMounted(async () => {
  await loadTags();
  await loadPosts(true);
});
</script>

<template>
  <div class="section forum-container">
    <div class="forum-header">
      <h1 class="forum-title">
        <i class="fas fa-comments me-2"></i>
        交流区
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
            <div class="section-title">{{ section.name }}</div>
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
            加载中...
          </div>
          <div v-else-if="!posts.length" class="forum-empty">
            <i class="fas fa-inbox"></i>
            暂无帖子
          </div>
          <div v-else class="forum-post-list">
            <div
                v-for="post in posts"
                :key="post.id"
                class="forum-post-item"
                @click="openPost(post)"
            >
              <div class="forum-post-title">{{ post.title }}</div>
              <div class="forum-post-meta">
                <span class="author">{{ post.author_nickname || post.author_username }}</span>
                <span class="time">{{ formatTime(post.created_at) }}</span>
                <span class="reply-count">
                  <i class="fas fa-comment-alt"></i>
                  {{ post.reply_count }} 回复
                </span>
              </div>
            </div>
          </div>

          <div v-if="postsHasMore && !loadingPosts" class="forum-footer">
            <button class="forum-btn forum-btn-secondary" @click="loadPosts(false)">
              加载更多
            </button>
          </div>
        </div>
      </div>
    </div>

    <!-- 帖子详情 -->
    <div v-else class="forum-post-detail">
      <div class="forum-post-detail-header">
        <button class="forum-btn forum-btn-secondary" @click="currentPost = null">
          <i class="fas fa-arrow-left"></i>
          返回列表
        </button>
      </div>

      <div class="forum-post-card">
        <h2 class="forum-post-title-detail">{{ currentPost.title }}</h2>
        <div class="forum-post-meta-detail">
          <span>{{ currentPost.author_nickname || currentPost.author_username }}</span>
          <span>{{ formatTime(currentPost.created_at) }}</span>
        </div>
        <div class="forum-post-content" v-html="currentPost.content"></div>
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
            <div class="reply-content" v-html="reply.content"></div>
          </div>
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
        <div class="editor-content" contenteditable="true"
             v-html="editorForm.content"
             @input="editorForm.content = $event.target.innerHTML"
        ></div>
        <div class="editor-actions">
          <button class="forum-btn forum-btn-primary" @click="openReply">
            使用弹窗编辑
          </button>
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
                v-html="editorForm.content"
                @input="editorForm.content = $event.target.innerHTML"
            ></div>
          </div>
        </div>
        <div class="forum-editor-footer">
          <button class="forum-btn forum-btn-secondary" @click="closeEditor">
            取消
          </button>
          <button class="forum-btn forum-btn-primary" @click="submitEditor">
            确定
          </button>
        </div>
      </div>
    </div>
  </div>
</template>

<style scoped>
/* 关键样式来自 forum.css */

/* 顶部 */
.forum-header {
  margin-bottom: 16px;
}

.forum-title {
  font-size: 20px;
  font-weight: 600;
}

.forum-subtitle {
  font-size: 14px;
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
  gap: 8px;
}

.section-card {
  display: flex;
  align-items: center;
  padding: 10px 12px;
  border-radius: 12px;
  background: #f9fafb;
  cursor: pointer;
  transition: background 0.15s ease, transform 0.1s ease;
}

.section-card:hover {
  background: #eef2ff;
  transform: translateY(-1px);
}

.section-card.active {
  background: #4f46e5;
  color: #fff;
}

.section-icon {
  width: 40px;
  height: 40px;
  border-radius: 12px;
  background: #e5e7eb;
  display: flex;
  align-items: center;
  justify-content: center;
  margin-right: 10px;
}

.section-card.active .section-icon {
  background: rgba(255, 255, 255, 0.1);
}

.section-info {
  flex: 1;
}

.section-title {
  font-size: 14px;
  font-weight: 600;
}

.section-desc {
  font-size: 12px;
  color: #6b7280;
}

/* 帖子列表 */
.forum-content {
  background: #fff;
  border-radius: 12px;
  box-shadow: 0 12px 25px rgba(15, 23, 42, 0.08);
  padding: 10px 12px;
  display: flex;
  flex-direction: column;
}

.forum-toolbar {
  display: flex;
  justify-content: space-between;
  align-items: center;
  margin-bottom: 8px;
}

.forum-tags-label {
  font-size: 12px;
  color: #6b7280;
  margin-right: 4px;
}

.forum-tag {
  display: inline-block;
  font-size: 12px;
  background: #eef2ff;
  color: #4f46e5;
  padding: 2px 8px;
  border-radius: 999px;
  margin-right: 4px;
}

/* 按钮 */
.forum-btn {
  border-radius: 999px;
  border: none;
  padding: 5px 12px;
  font-size: 13px;
  cursor: pointer;
}

.forum-btn-primary {
  background: linear-gradient(135deg, #667eea, #764ba2);
  color: #fff;
}

.forum-btn-secondary {
  background: #e5e7eb;
  color: #374151;
}

/* 帖子列表 */
.forum-posts {
  flex: 1;
  margin-top: 6px;
}

.forum-loading,
.forum-empty {
  padding: 30px 0;
  text-align: center;
  color: #6b7280;
}

.forum-post-list {
  display: flex;
  flex-direction: column;
  gap: 8px;
}

.forum-post-item {
  padding: 8px 10px;
  border-radius: 10px;
  background: #f9fafb;
  cursor: pointer;
}

.forum-post-item:hover {
  background: #eef2ff;
}

.forum-post-title {
  font-size: 14px;
  font-weight: 600;
}

.forum-post-meta {
  font-size: 12px;
  color: #9ca3af;
  display: flex;
  gap: 8px;
  margin-top: 2px;
}

.forum-footer {
  text-align: center;
  padding: 10px 0 4px;
}

/* 帖子详情 */
.forum-post-detail-header {
  margin-bottom: 10px;
}

.forum-post-card {
  background: #fff;
  border-radius: 12px;
  box-shadow: 0 12px 25px rgba(15, 23, 42, 0.08);
  padding: 12px;
  margin-bottom: 12px;
}

.forum-post-title-detail {
  font-size: 18px;
  font-weight: 600;
  margin-bottom: 6px;
}

.forum-post-meta-detail {
  font-size: 12px;
  color: #9ca3af;
  margin-bottom: 8px;
}

.forum-post-content {
  font-size: 14px;
  line-height: 1.6;
}

/* 回复列表 */
.forum-replies {
  background: #fff;
  border-radius: 12px;
  box-shadow: 0 12px 25px rgba(15, 23, 42, 0.08);
  padding: 12px;
  margin-bottom: 12px;
}

.reply-title {
  font-size: 15px;
  font-weight: 600;
  margin-bottom: 8px;
}

.forum-reply-list {
  display: flex;
  flex-direction: column;
  gap: 8px;
}

.forum-reply-item {
  padding: 8px 10px;
  border-radius: 10px;
  background: #f9fafb;
}

.reply-header {
  font-size: 12px;
  color: #9ca3af;
  display: flex;
  justify-content: space-between;
  margin-bottom: 4px;
}

.reply-content {
  font-size: 14px;
}

/* 简易编辑器 */
.forum-reply-editor {
  background: #fff;
  border-radius: 12px;
  box-shadow: 0 12px 25px rgba(15, 23, 42, 0.08);
  padding: 12px;
}

.editor-toolbar {
  margin-bottom: 6px;
}

.editor-content {
  min-height: 120px;
  border-radius: 10px;
  border: 1px solid #d1d5db;
  padding: 6px 8px;
  font-size: 14px;
  background: #f9fafb;
}

/* 弹窗 */
.forum-editor-modal {
  position: fixed;
  inset: 0;
  background: rgba(15, 23, 42, 0.55);
  display: flex;
  align-items: center;
  justify-content: center;
  z-index: 1600;
}

.forum-editor-dialog {
  width: 640px;
  max-width: calc(100vw - 40px);
  max-height: calc(100vh - 40px);
  background: #fff;
  border-radius: 12px;
  display: flex;
  flex-direction: column;
}

.forum-editor-header,
.forum-editor-footer {
  padding: 8px 10px;
  border-bottom: 1px solid #e5e7eb;
  display: flex;
  align-items: center;
  justify-content: space-between;
}

.forum-editor-footer {
  border-top: 1px solid #e5e7eb;
  border-bottom: none;
}

.forum-editor-body {
  padding: 10px;
  overflow-y: auto;
}

.forum-editor-close {
  border: none;
  background: transparent;
  cursor: pointer;
}

.editor-field {
  margin-bottom: 10px;
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
