import {createVNode, render} from 'vue'
import MessageBox from '@/components/MessageBox.vue'

/**
 * 显示消息弹窗
 * @param {Object} options
 * @param {string} options.message - 提示内容
 * @param {string} [options.title='提示信息'] - 标题
 * @param {boolean} [options.showCancelButton=false] - 是否显示取消按钮
 * @param {string} [options.confirmButtonText='确定']
 * @param {string} [options.cancelButtonText='取消']
 * @returns {Promise<boolean>} 用户点击确认返回 true，取消/关闭返回 false
 */
export function messageBox(options) {
    return new Promise((resolve) => {
        // 创建虚拟节点
        const vnode = createVNode(MessageBox, {
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
            instance.resolve((value) => {
                // 自动清理 DOM
                render(null, container);
                document.body.removeChild(container);
                resolve(value);
            });
            instance.open();
        }
    });
}

// 快捷方法
export function alert(message, title = '提示') {
    return messageBox({message, title, showCancelButton: false});
}

export function confirm(message, title = '确认') {
    return messageBox({message, title, showCancelButton: true});
}

export function showSuccessMessage(message) {
    return alert(message, '操作成功');
}

export function showErrorMessage(message) {
    return alert(message, '操作失败');
}

export function showInfoMessage(message) {
    return alert(message, '提示信息');
}
