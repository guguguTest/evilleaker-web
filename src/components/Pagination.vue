<script setup>
import {computed} from 'vue';

const props = defineProps({
    currentPage: {
        type: Number,
        required: true
    },
    totalPages: {
        type: Number,
        required: true
    },
    totalItems: {
        type: Number,
        default: 0
    },
    itemsPerPage: {
        type: Number,
        default: 10
    },
    maxVisiblePages: {
        type: Number,
        default: 5
    }
});

const emits = defineEmits(['change']);

const pages = computed(() => {
    const max = props.maxVisiblePages;
    const half = Math.floor(max / 2);
    let start = Math.max(1, props.currentPage - half);
    let end = Math.min(props.totalPages, start + max - 1);

    if (end - start < max - 1) {
        start = Math.max(1, end - max + 1);
    }

    return Array.from({length: end - start + 1}, (_, i) => start + i);
});

function goToPage(page) {
    if (page < 1 || page > props.totalPages)
        return;
    emits('change', page);
}

function prev() {
    goToPage(props.currentPage - 1);
}

function next() {
    goToPage(props.currentPage + 1);
}
</script>

<template>
    <slot name="solt"
          :prev="prev"
          :next="next"
          :go="goToPage"
          :curr="currentPage"
          :total="totalPages"
          :prevDisabled="currentPage === 1"
          :nextDisabled="currentPage === totalPages"
          :pages="pages"
    >
        <div v-if="totalPages > 1">
            <button @click="prev" :disabled="currentPage === 1">prev</button>
            <button v-for="p in pages" :class="{ active: p === currentPage }" @click="goToPage(p)">
                {{ p }}
            </button>
            <button @click="next" :disabled="currentPage === totalPages">next</button>
        </div>
    </slot>
    <!--    <div :class="props.class" v-if="totalPages > 1">-->
    <!--        <slot name="prev" :go="prev" :disabled="currentPage === 1">-->
    <!--            <button @click="prev" :disabled="currentPage === 1">prev</button>-->
    <!--        </slot>-->
    <!--        <slot name="page" v-for="p in pages" :page="p" :current="currentPage" :go="goToPage"-->
    <!--              :active="p === currentPage">-->
    <!--            <button :class="{ active: p === currentPage }" @click="goToPage(p)">-->
    <!--                {{ p }}-->
    <!--            </button>-->
    <!--        </slot>-->
    <!--        <slot name="next" :go="next" :disabled="currentPage === totalPages">-->
    <!--            <button @click="next" :disabled="currentPage === totalPages">next</button>-->
    <!--        </slot>-->
    <!--    </div>-->
</template>

<style scoped>

</style>