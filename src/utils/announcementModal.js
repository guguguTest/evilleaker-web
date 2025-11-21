import {reactive} from 'vue';
import dompurify from 'dompurify';

export const annData = reactive({
    visible: false,
    title: '',
    content: '',
    contentTranslated: '',
    translateBtn: 'Translate',
    translating: false,
});

export function showAnnModal({title, content}) {
    // 处理表情标记 [emoji:id:path] 或 [emoji:id:path:audioPath]
    const emojiRegex = /\[emoji:(\d+):((?:https?:)?\/[^\]]+?)(?::([^\]]+?))?\]/g;
    const baseUrl = import.meta.env.VITE_API_BASE_URL;
    content = content.replace(emojiRegex, (match, id, path, audioPath) => {
        const fullPath = path.startsWith('http') ? path : `${baseUrl}${path}`;
        return `<img src="${fullPath}" class="announcement-emoji" style="max-width: 60px; max-height: 60px; vertical-align: middle; margin: 0 4px;" alt="表情">`;
    });
    // 处理图片标记 [image:/path/to/image]
    const imageRegex = /\[image:(\/[^\]]+?)\]/g;
    content = content.replace(imageRegex, (match, path) => {
        const fullPath = `${baseUrl}${path}`;
        return `<img src="${fullPath}" class="announcement-image" style="max-width: 100%; height: auto; display: block; margin: 10px 0; border-radius: 8px;" alt="图片">`;
    });
    annData.title = title;
    annData.content = dompurify.sanitize(content);
    annData.visible = true;
}

export function hideAnnModal() {
    annData.visible = false;
    annData.content = '';
    annData.contentTranslated = '';
    annData.translateBtn = 'Translate';
    annData.translating = false;
}

export function translateAnnModal(lang) {
    if (!annData.contentTranslated) {
        if (annData.translating)
            return;
        annData.translating = true;
        annData.translateBtn = 'Translating...';
        translateText(annData.content, lang).then(translatedText => {
            annData.contentTranslated = translatedText;
            annData.translating = false;
            annData.translateBtn = 'Original';
        });
    } else {
        annData.translateBtn = 'Translate';
        annData.contentTranslated = '';
    }
}

async function translateText(text, targetLang) {
    try {
        const url = `https://translate.googleapis.com/translate_a/single?client=gtx&sl=zh-CN&tl=${targetLang}&dt=t&q=${encodeURIComponent(text)}`;
        const response = await fetch(url);
        const data = await response.json();
        if (data && data[0]) {
            return data[0].map(item => item[0]).join('');
        }
        throw new Error('翻译数据格式错误');
    } catch (error) {
        console.warn('API翻译失败，使用备用方案');
        window.open(`https://translate.google.com/?sl=zh-CN&tl=${targetLang}&text=${encodeURIComponent(text)}&op=translate`, '_blank');
        throw error;
    }
}
