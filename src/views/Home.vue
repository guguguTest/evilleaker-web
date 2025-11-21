<script setup>
import {onMounted, ref} from 'vue';
import {getAnnouncement, getAnnouncementList} from '@/api/announcement';
import Pagination from '@/components/Pagination.vue';
import {showAnnModal} from '@/utils/announcementModal';

const pageData = ref({
    currentPage: 1,
    itemsPerPage: 5,
    totalItems: 0,
    totalPages: 1
});
const loading = ref(true);
const errorMsg = ref('');
const annTopList = ref([]);
const annList = ref([]);

onMounted(() => {
    pageChange(1);
});

const typeMap = {
    'top': '置顶',
    'important': '重要',
    'notice': '通知',
    'update': '更新'
};

function getTypeText(type) {
    return typeMap[type] || '通知';
}

function dateFormat(date) {
    return new Date(date).toLocaleDateString('zh-CN');
}

function pageChange(page) {
    pageData.value.currentPage = page;

    loading.value = true;
    getAnnouncementList({
        page: pageData.value.currentPage,
        limit: pageData.value.itemsPerPage
    }).then(res => {
        annTopList.value = res.pinned;
        annList.value = res.announcements;
        pageData.value = res.pagination;
    }).catch(_ => {
        errorMsg.value = '加载公告失败，请刷新重试';
    }).finally(() => {
        loading.value = false;
        if (annTopList.value.length <= 0 || annList.value.length <= 0)
            errorMsg.value = '暂无公告';
    });
}

function onAnnClick(id) {
    getAnnouncement(id).then(res => {
        showAnnModal({
            title: res.title,
            content: res.content,
        });
    }).catch(_ => {

    });
}
</script>

<template>
    <div class="section">
        <h1 class="page-title" data-i18n="home.title">首页</h1>
        <!-- 公告区域 -->
        <div class="announcements-container" id="announcements-container">
            <div class="pinned-announcements-section" v-if="annTopList.length > 0">
                <div class="pinned-announcements-header">
                    <i class="fas fa-thumbtack"></i>
                    <h3>置顶公告</h3>
                </div>
                <div class="announcement-list">
                    <div class="announcement-item" v-for="ann in annTopList" @click="onAnnClick(ann.id)">
                        <div class="announcement-header">
                            <span class="announcement-type"
                                  :class="ann.type || 'notice'"
                            >{{ getTypeText(ann.type) }}</span>
                            <h3 class="announcement-title">{{ ann.title }}</h3>
                            <span class="announcement-date">{{ dateFormat(ann.created_at) }}</span>
                        </div>
                    </div>
                </div>
            </div>
            <div class="normal-announcements-section" v-if="annList.length > 0">
                <div class="normal-announcements-header">
                    <i class="fas fa-list"></i>
                    <h3>最新公告</h3>
                </div>
                <div class="announcement-list">
                    <div class="announcement-item" v-for="ann in annList" @click="onAnnClick(ann.id)">
                        <div class="announcement-header">
                            <span class="announcement-type"
                                  :class="ann.type || 'notice'"
                            >{{ getTypeText(ann.type) }}</span>
                            <h3 class="announcement-title">{{ ann.title }}</h3>
                            <span class="announcement-date">{{ dateFormat(ann.created_at) }}</span>
                        </div>
                    </div>
                </div>
                <pagination
                    @change="pageChange"
                    :currentPage="pageData.currentPage"
                    :totalPages="pageData.totalPages"
                    :totalItems="pageData.totalItems"
                    :itemsPerPage="pageData.itemsPerPage"
                    :maxVisiblePages="5">
                    <template #solt="{ prev, next, go, pages, curr, total }">
                        <div class="announcement-pagination" v-if="total > 1">
                            <ul class="pagination">
                                <li class="page-item">
                                    <a class="page-link" href="javascript:void(0);" @click="prev">上一页</a>
                                </li>
                                <li class="page-item" v-for="p in pages" :class="{ active: p === curr }">
                                    <a class="page-link" href="javascript:void(0);" @click="go(p)">{{ p }}</a>
                                </li>
                                <li class="page-item">
                                    <a class="page-link" href="javascript:void(0);" @click="next">下一页</a>
                                </li>
                            </ul>
                        </div>
                    </template>
                </pagination>
            </div>
            <div class="text-center" v-if="loading">
                <div class="spinner-border text-primary" role="status">
                    <span class="visually-hidden">加载中...</span>
                </div>
                <p data-i18n="home.announcementsLoading">公告加载中...</p>
            </div>
            <div class="no-announcements" v-if="errorMsg">{{ errorMsg }}</div>
        </div>
        <!-- footer -->
        <hr>
        <div class="welcome-section mt-5">
            <h2 class="section-title">
                <i class="fas fa-star"></i>
                <span data-i18n="home.welcome">MAY THE LEAKER BE WITH YOU!</span>
            </h2>
            <p data-i18n="home.selectFunction">请从左侧菜单选择功能</p>
        </div>
    </div>
</template>
