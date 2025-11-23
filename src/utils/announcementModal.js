import {createVNode, render} from 'vue';
import dompurify from 'dompurify';
import {baseUrl} from '@/api/base';
import AnnouncementModal from '@/components/AnnouncementModal.vue';

function handleContent(content) {
    // 处理表情标记 [emoji:id:path] 或 [emoji:id:path:audioPath]
    const emojiRegex = /\[emoji:(\d+):((?:https?:)?\/[^\]]+?)(?::([^\]]+?))?\]/g;
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
    // 防止XSS
    return dompurify.sanitize(content);
}

/**
 * 显示公告弹窗
 * @param {Object} options
 * @param {string} [options.title='公告'] - 标题
 * @param {string} options.content - 公告内容（必填）
 * @param {string} [options.closeButtonText='关闭']
 * @returns {Promise<void>} 关闭返回
 */
export function showAnnModal(options) {
    return new Promise((resolve) => {
        // 预处理内容
        options.content = handleContent(options.content);

        // 创建虚拟节点
        const vnode = createVNode(AnnouncementModal, {
            ...options
        });

        // 创建挂载容器
        const container = document.createElement('div');
        document.body.appendChild(container);

        // 渲染组件
        render(vnode, container);

        // 获取组件实例（通过 expose）
        const instance = vnode.component?.exposed;
        if (instance) {
            instance.resolve(() => {
                // 清理DOM
                render(null, container);
                document.body.removeChild(container);
                resolve();
            });
            instance.open();
        }
    });
}