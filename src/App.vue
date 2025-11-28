<script setup>
import {RouterView} from 'vue-router'
import SideBar from '@/components/SideBar.vue';
import NavBar from '@/components/NavBar.vue';
import {useSidebarStore} from '@/stores/sidebar';
import zhCn from 'element-plus/es/locale/lang/zh-cn'
import ChatWindow from '@/components/ChatWindow.vue';

const sidebar = useSidebarStore()
</script>

<template>
  <el-config-provider :locale="zhCn">
    <nav-bar/>
    <side-bar/>
    <div class="main-content" id="content-container">
      <RouterView/>
    </div>
    <div class="spa-loader">
      <div class="spinner-border text-primary" role="status">
        <span class="visually-hidden">Loading...</span>
      </div>
    </div>
    <div id="sidebar-overlay" class="sidebar-overlay" :class="{show: sidebar.state}" @click="sidebar.hide()"></div>
  </el-config-provider>
  <ChatWindow />
</template>

<style scoped>

</style>
