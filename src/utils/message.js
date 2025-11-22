// src/utils/message.js

function ensureModal() {
    let modal = document.getElementById('message-modal');
    if (!modal) {
        const modalHTML = `
      <div id="message-modal" class="modal">
        <div class="modal-content">
          <div class="modal-header">
            <h5 id="modal-title">提示信息</h5>
            <button type="button" class="modal-close">&times;</button>
          </div>
          <div class="modal-body">
            <p id="modal-content"></p>
          </div>
          <div class="modal-footer">
            <button id="modal-ok" class="btn-ok">确定</button>
          </div>
        </div>
      </div>
    `;
        document.body.insertAdjacentHTML('beforeend', modalHTML);

        modal = document.getElementById('message-modal');

        // 关闭按钮
        modal.querySelector('.modal-close').addEventListener('click', () => {
            modal.classList.remove('show');
        });

        // 确定按钮
        document.getElementById('modal-ok').addEventListener('click', () => {
            modal.classList.remove('show');
        });

        // 点击遮罩关闭
        modal.addEventListener('click', function (e) {
            if (e.target === this) {
                this.classList.remove('show');
            }
        });
    }

    return modal;
}

function showModal(title, message) {
    const modal = ensureModal();
    const titleEl = document.getElementById('modal-title');
    const contentEl = document.getElementById('modal-content');

    if (titleEl) titleEl.textContent = title;
    if (contentEl) contentEl.textContent = message;

    modal.classList.add('show');
}

export function showSuccessMessage(message) {
    showModal('操作成功', message);
}

export function showErrorMessage(message) {
    showModal('操作失败', message);
}

export function showInfoMessage(message) {
    showModal('提示信息', message);
}
