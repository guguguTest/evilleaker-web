// src/stores/fortune.js
import {defineStore} from 'pinia';
import {ref} from 'vue';

export const useFortuneStore = defineStore('fortune', () => {
    // —— state ——
    const song = ref(null);            // { id, title, artist, catname, lev_* , we_* , image }
    const luck = ref('???');
    const recommendations = ref({ lucky: '?', unlucky: '?' });
    const canDraw = ref(false);
    const nextDrawTime = ref(null);    // ISO string or null

    // —— setters（只通过这些方法修改 state）——
    function setSong(val) { song.value = val; }
    function setLuck(val) { luck.value = val || '???'; }
    function setRecommendations(val) {
        const safe = val && typeof val === 'object' ? val : {lucky: '?', unlucky: '?'};
        recommendations.value = { lucky: String(safe.lucky || '?'), unlucky: String(safe.unlucky || '?') };
    }
    function setStatus({ can, nextTime } = {}) {
        if (typeof can === 'boolean') canDraw.value = can;
        nextDrawTime.value = nextTime || null;
    }
    function reset() {
        song.value = null;
        luck.value = '???';
        recommendations.value = { lucky: '?', unlucky: '?' };
        canDraw.value = false;
        nextDrawTime.value = null;
    }

    return {
        // state
        song, luck, recommendations, canDraw, nextDrawTime,
        // setters
        setSong, setLuck, setRecommendations, setStatus, reset,
    };
});