<script setup>
import {annData, hideAnnModal, translateAnnModal} from '@/utils/announcementModal'
import {useI18nStore} from '@/stores/i18n';

const i18nStore = useI18nStore();
</script>

<template>
    <div class="announcement-modal" :class="{show: annData.visible}" id="announcement-modal"
         @click="hideAnnModal">
        <div class="announcement-modal-content" @click.stop>
            <div class="announcement-modal-header">
                <h3 class="announcement-modal-title">{{ annData.title }}</h3>
                <div class="announcement-modal-actions">
                    <button class="announcement-translate-btn" title="Translate" v-if="i18nStore.lang !== 'zh'"
                            @click="translateAnnModal(i18nStore.lang)">
                        <i class="fas fa-language"></i>
                        <span class="translate-text">{{ annData.translateBtn }}</span>
                    </button>
                    <button class="announcement-modal-close" @click="hideAnnModal">&times;</button>
                </div>
            </div>
            <div class="announcement-modal-body">
                <div class="html-content"
                     v-html="annData.contentTranslated ? annData.contentTranslated : annData.content"></div>
            </div>
            <div class="announcement-modal-footer">
                <button class="announcement-modal-ok" @click="hideAnnModal">关闭</button>
            </div>
        </div>
    </div>
</template>

<style scoped>

</style>