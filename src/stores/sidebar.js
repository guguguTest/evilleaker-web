import {defineStore} from 'pinia'
import {ref} from 'vue'

export const useSidebarStore = defineStore('sidebar', () => {
    const state = ref(false)

    function show() {
        state.value = true
    }

    function hide() {
        state.value = false
    }

    function toggle() {
        state.value = !state.value
    }

    return {state, show, hide, toggle};
});
