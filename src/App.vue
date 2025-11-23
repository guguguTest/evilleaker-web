<script setup>
import {RouterView} from 'vue-router'
import SideBar from '@/components/SideBar.vue';
import NavBar from '@/components/NavBar.vue';
import {useSidebarStore} from '@/stores/sidebar';

const sidebar = useSidebarStore()
</script>

<template>
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
</template>

<style scoped>

</style>
