import { ElMessage, ElMessageBox } from 'element-plus'

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
    return ElMessageBox({
        ...options,
        type: options.type || 'info'
    }).then(() => true).catch(() => false);
}

// 快捷方法
export function alert(message, title = '提示') {
    return ElMessageBox.alert(message, title, {
        confirmButtonText: '确定'
    }).then(() => true).catch(() => false);
}

export function confirm(message, title = '确认') {
    return ElMessageBox.confirm(message, title, {
        confirmButtonText: '确定',
        cancelButtonText: '取消',
        type: 'warning'
    }).then(() => true).catch(() => false);
}

export function showSuccessMessage(message) {
    ElMessage.success(message);
    return Promise.resolve(true);
}

export function showErrorMessage(message) {
    ElMessage.error(message);
    return Promise.resolve(false);
}

export function showInfoMessage(message) {
    ElMessage.info(message);
    return Promise.resolve(true);
}
