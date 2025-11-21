<script setup>
import {reactive, ref} from 'vue';

const confettiContainer = ref(null);
const visible = ref(false);
const data = reactive({
    title: '',
    message: '',
    duration: 3000,
    callback: null,
});

let timer = null;

function show({title = '', message = '', duration = 3000, callback = null}) {
    data.title = title;
    data.message = message;
    data.duration = duration;
    data.callback = callback;

    visible.value = true;

    createConfetti(30);

    if (timer)
        clearTimeout(timer);
    timer = setTimeout(() => {
        visible.value = false;
        if (typeof data.callback === 'function')
            data.callback();
    }, duration);
}

function createConfetti(count) {
    if (!confettiContainer.value)
        return;
    for (let i = 0; i < count; i++) {
        const confetti = document.createElement('div');
        confetti.className = 'confetti';
        confetti.style.left = Math.random() * 100 + '%';
        confetti.style.animationDelay = Math.random() * 0.5 + 's';
        confetti.style.transform = `rotate(${Math.random() * 360}deg)`;
        confettiContainer.value.appendChild(confetti);
    }
}

defineExpose({show});
</script>

<template>
    <div id="success-animation-modal" class="success-animation-modal" :class="{show: visible}">
        <div class="success-animation-content">
            <!-- 光晕效果 -->
            <div class="success-glow"></div>
            <!-- 星星效果 -->
            <div class="success-stars">
                <span class="star"></span>
                <span class="star"></span>
                <span class="star"></span>
                <span class="star"></span>
                <span class="star"></span>
            </div>
            <!-- 成功图标 -->
            <div class="success-checkmark-wrapper">
                <div class="success-circle">
                    <svg class="success-checkmark" xmlns="http://www.w3.org/2000/svg" viewBox="0 0 52 52">
                        <circle class="success-checkmark-circle" cx="26" cy="26" r="25"/>
                        <path class="success-checkmark-check" d="M14.1 27.2l7.1 7.2 16.7-16.8"/>
                    </svg>
                </div>
            </div>
            <!-- 文字内容 -->
            <h2 class="success-title">{{ data.title }}</h2>
            <p class="success-message">{{ data.message }}</p>
            <!-- 进度条 -->
            <div class="success-progress-bar">
                <div class="success-progress"></div>
            </div>
            <!-- 彩带效果 -->
            <div class="confetti-container" id="confetti-container" ref="confettiContainer"></div>
        </div>
    </div>
</template>

<style scoped>
</style>
