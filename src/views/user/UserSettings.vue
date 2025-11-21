<script setup>

</script>

<template>
    <div class="user-settings-container">
        <div class="settings-header">
            <h1 class="settings-title">
                <i class="fas fa-user-cog"></i>
                <span data-i18n="userSettings.title">用户设置</span>
            </h1>
        </div>
        <div class="settings-content">
            <!-- 用户概览卡片 -->
            <div class="user-overview-card">
                <div class="user-overview-bg"></div>
                <div class="user-overview-content">
                    <div class="user-avatar-section">
                        <div class="avatar-wrapper">
                            <img id="settings-avatar" class="user-avatar-display" src="" alt="用户头像">
                            <div class="avatar-upload-overlay">
                                <i class="fas fa-camera"></i>
                            </div>
                        </div>
                        <input type="file" id="avatar-upload" accept="image/*" style="display: none;">
                    </div>

                    <div class="user-info-summary">
                        <h2 id="settings-username" class="user-display-name"></h2>
                        <p id="settings-email" class="user-email"></p>
                        <div class="user-badges">
                            <span class="badge-uid">UID: <span id="settings-uid"></span></span>
                            <span id="settings-user-state"></span>
                        </div>
                    </div>
                </div>
            </div>

            <!-- 头像裁剪模态框 -->
            <div id="avatar-crop-section" class="avatar-crop-modal" style="display: none;">
                <div class="crop-modal-content">
                    <h3 data-i18n="userSettings.adjustAvatar">调整头像</h3>
                    <div id="avatar-crop-container" class="crop-container"></div>
                    <div class="crop-actions">
                        <button id="cancel-avatar-btn" class="btn-secondary">
                            <i class="fas fa-times"></i> <span data-i18n="common.cancel">取消</span>
                        </button>
                        <button id="save-avatar-btn" class="btn-primary">
                            <i class="fas fa-check"></i> <span data-i18n="common.save">保存</span>
                        </button>
                    </div>
                </div>
            </div>

            <!-- 设置选项卡 -->
            <div class="settings-tabs">
                <div class="tab-nav">
                    <button class="tab-btn active" data-tab="profile">
                        <i class="fas fa-user"></i>
                        <span data-i18n="userSettings.profile">个人信息</span>
                    </button>
                    <button class="tab-btn" data-tab="points">
                        <i class="fas fa-coins"></i>
                        <span data-i18n="userSettings.pointsInfo">积分信息</span>
                    </button>
                    <button class="tab-btn" data-tab="security">
                        <i class="fas fa-shield-alt"></i>
                        <span data-i18n="userSettings.security">安全设置</span>
                    </button>
                    <button class="tab-btn" data-tab="binding">
                        <i class="fas fa-link"></i>
                        <span data-i18n="userSettings.binding">绑定管理</span>
                    </button>
                    <button class="tab-btn" data-tab="privacy">
                        <i class="fas fa-user-shield"></i>
                        <span data-i18n="userSettings.privacy">隐私设置</span>
                    </button>
                </div>

                <!-- 个人信息选项卡 -->
                <div class="tab-content active" id="profile-tab">
                    <div class="settings-card">
                        <div class="card-header">
                            <h3><i class="fas fa-id-card"></i> <span data-i18n="userSettings.basicInfo">基本信息</span>
                            </h3>
                        </div>
                        <div class="card-body">
                            <div class="info-row">
                                <label data-i18n="userSettings.username">用户名</label>
                                <div class="info-value" id="settings-username-display"></div>
                            </div>
                            <div class="info-row">
                                <label data-i18n="userSettings.email">邮箱</label>
                                <div class="info-value" id="settings-email-display"></div>
                            </div>
                            <div class="form-group">
                                <label for="settings-nickname" data-i18n="userSettings.setNickname">
                                    设置昵称
                                </label>
                                <div class="input-wrapper">
                                    <input type="text" id="settings-nickname" class="form-input" maxlength="20"
                                           data-i18n="userSettings.nicknamePlaceholder" placeholder="设置您的昵称">
                                    <span class="char-counter"><span id="settings-nickname-counter">0</span>/20</span>
                                </div>
                            </div>
                            <button id="save-profile-btn" class="btn-primary btn-block">
                                <i class="fas fa-save"></i> <span
                                data-i18n="userSettings.saveProfile">保存个人信息</span>
                            </button>
                        </div>
                    </div>
                </div>

                <!-- 积分信息选项卡 -->
                <div class="tab-content" id="points-tab">
                    <div class="settings-card">
                        <div class="card-header">
                            <h3><i class="fas fa-chart-line"></i> <span
                                data-i18n="userSettings.pointsStats">积分统计</span></h3>
                        </div>
                        <div class="card-body">
                            <div class="points-grid">
                                <div class="points-item">
                                    <div class="points-icon">
                                        <i class="fas fa-star"></i>
                                    </div>
                                    <div class="points-info">
                                        <div class="points-label" data-i18n="userSettings.totalPoints">总积分</div>
                                        <div class="points-value" id="settings-total-points">0</div>
                                    </div>
                                </div>
                                <div class="points-item">
                                    <div class="points-icon">
                                        <i class="fas fa-coins"></i>
                                    </div>
                                    <div class="points-info">
                                        <div class="points-label" data-i18n="userSettings.normalPoints">普通积分</div>
                                        <div class="points-value" id="settings-points">0</div>
                                    </div>
                                </div>
                                <div class="points-item">
                                    <div class="points-icon">
                                        <i class="fas fa-dove"></i>
                                    </div>
                                    <div class="points-info">
                                        <div class="points-label" data-i18n="userSettings.point2">鸽屋积分</div>
                                        <div class="points-value" id="settings-point2">0</div>
                                    </div>
                                </div>
                                <div class="points-item">
                                    <div class="points-icon">
                                        <i class="fas fa-gem"></i>
                                    </div>
                                    <div class="points-info">
                                        <div class="points-label" data-i18n="userSettings.creditPoints">CREDIT点数</div>
                                        <div class="points-value" id="settings-credit">0</div>
                                    </div>
                                </div>
                            </div>
                        </div>
                    </div>
                </div>

                <!-- 安全设置选项卡 -->
                <div class="tab-content" id="security-tab">
                    <div class="settings-card">
                        <div class="card-header">
                            <h3><i class="fas fa-lock"></i> <span
                                data-i18n="userSettings.changePassword">修改密码</span></h3>
                        </div>
                        <div class="card-body">
                            <div class="form-group">
                                <label for="current-password">
                                    <i class="fas fa-key"></i> <span
                                    data-i18n="userSettings.currentPassword">当前密码</span>
                                </label>
                                <input type="password" id="current-password" class="form-input"
                                       data-i18n="userSettings.currentPasswordPlaceholder" placeholder="请输入当前密码">
                            </div>
                            <div class="form-group">
                                <label for="new-password">
                                    <i class="fas fa-lock"></i> <span data-i18n="userSettings.newPassword">新密码</span>
                                </label>
                                <div class="input-wrapper">
                                    <input type="password" id="new-password" class="form-input" maxlength="16"
                                           data-i18n="userSettings.newPasswordPlaceholder" placeholder="请输入新密码">
                                    <span class="char-counter"><span id="new-password-counter">0</span>/16</span>
                                </div>
                            </div>
                            <div class="form-group">
                                <label for="confirm-password">
                                    <i class="fas fa-lock"></i> <span
                                    data-i18n="userSettings.confirmNewPassword">确认新密码</span>
                                </label>
                                <input type="password" id="confirm-password" class="form-input" maxlength="16"
                                       data-i18n="userSettings.confirmNewPasswordPlaceholder"
                                       placeholder="请再次输入新密码">
                            </div>
                            <button id="save-password-btn" class="btn-primary btn-block">
                                <i class="fas fa-save"></i> <span
                                data-i18n="userSettings.updatePassword">更新密码</span>
                            </button>
                        </div>
                    </div>
                </div>

                <!-- 绑定管理选项卡 -->
                <div class="tab-content" id="binding-tab">
                    <!-- 查分绑定卡片 -->
                    <div class="settings-card" id="ccb-binding-section" style="display: none;">
                        <div class="card-header">
                            <h3>
                                <i class="fas fa-gamepad"></i>
                                <span data-i18n="userSettings.ccbBinding">查分绑定信息</span>
                            </h3>
                            <button id="ccb-visibility-toggle" class="visibility-toggle-btn" title="隐藏/显示绑定信息">
                                <i class="fas fa-eye"></i>
                            </button>
                        </div>
                        <div class="card-body">
                            <!-- 卡片选项卡导航 -->
                            <div class="binding-tab-nav">
                                <button class="binding-tab-btn active" data-card="1">
                                    <i class="fas fa-credit-card"></i>
                                    <span data-i18n="ccb.card">卡片</span> 1
                                    <span class="card-active-star" style="display: none;">⭐</span>
                                </button>
                                <button class="binding-tab-btn" data-card="2">
                                    <i class="fas fa-credit-card"></i>
                                    <span data-i18n="ccb.card">卡片</span> 2
                                    <span class="card-active-star" style="display: none;">⭐</span>
                                </button>
                                <button class="binding-tab-btn" data-card="3">
                                    <i class="fas fa-credit-card"></i>
                                    <span data-i18n="ccb.card">卡片</span> 3
                                    <span class="card-active-star" style="display: none;">⭐</span>
                                </button>
                            </div>

                            <!-- 卡片1面板 -->
                            <div class="binding-tab-panel active" id="card-1-panel">
                                <div class="binding-info" style="display: none;">
                                    <div class="binding-item">
                                        <i class="fas fa-server"></i>
                                        <div>
                                            <label data-i18n="userSettings.server">服务器</label>
                                            <div class="binding-value sensitive-data" data-field="server">-</div>
                                        </div>
                                    </div>
                                    <div class="binding-item">
                                        <i class="fas fa-microchip"></i>
                                        <div>
                                            <label>KeyChip</label>
                                            <div class="binding-value sensitive-data" data-field="keychip">-</div>
                                        </div>
                                    </div>
                                    <div class="binding-item">
                                        <i class="fas fa-id-badge"></i>
                                        <div>
                                            <label data-i18n="userSettings.cardNumber">游戏卡号</label>
                                            <div class="binding-value sensitive-data" data-field="guid">-</div>
                                        </div>
                                    </div>
                                </div>
                                <div class="no-binding-hint" style="display: none;">
                                    <p class="text-muted text-center">
                                        <i class="fas fa-info-circle"></i>
                                        <span data-i18n="ccb.cardNotBound">该卡片尚未绑定</span>
                                    </p>
                                </div>
                                <button class="btn-danger btn-block ccb-unbind-btn" data-slot="1"
                                        style="display: none;">
                                    <i class="fas fa-unlink"></i> <span
                                    data-i18n="userSettings.unbindCard">解绑卡片</span>
                                </button>
                            </div>

                            <!-- 卡片2面板 -->
                            <div class="binding-tab-panel" id="card-2-panel">
                                <div class="binding-info" style="display: none;">
                                    <div class="binding-item">
                                        <i class="fas fa-server"></i>
                                        <div>
                                            <label data-i18n="userSettings.server">服务器</label>
                                            <div class="binding-value sensitive-data" data-field="server">-</div>
                                        </div>
                                    </div>
                                    <div class="binding-item">
                                        <i class="fas fa-microchip"></i>
                                        <div>
                                            <label>KeyChip</label>
                                            <div class="binding-value sensitive-data" data-field="keychip">-</div>
                                        </div>
                                    </div>
                                    <div class="binding-item">
                                        <i class="fas fa-id-badge"></i>
                                        <div>
                                            <label data-i18n="userSettings.cardNumber">游戏卡号</label>
                                            <div class="binding-value sensitive-data" data-field="guid">-</div>
                                        </div>
                                    </div>
                                </div>
                                <div class="no-binding-hint" style="display: none;">
                                    <p class="text-muted text-center">
                                        <i class="fas fa-info-circle"></i>
                                        <span data-i18n="ccb.cardNotBound">该卡片尚未绑定</span>
                                    </p>
                                </div>
                                <button class="btn-danger btn-block ccb-unbind-btn" data-slot="2"
                                        style="display: none;">
                                    <i class="fas fa-unlink"></i> <span
                                    data-i18n="userSettings.unbindCard">解绑卡片</span>
                                </button>
                            </div>

                            <!-- 卡片3面板 -->
                            <div class="binding-tab-panel" id="card-3-panel">
                                <div class="binding-info" style="display: none;">
                                    <div class="binding-item">
                                        <i class="fas fa-server"></i>
                                        <div>
                                            <label data-i18n="userSettings.server">服务器</label>
                                            <div class="binding-value sensitive-data" data-field="server">-</div>
                                        </div>
                                    </div>
                                    <div class="binding-item">
                                        <i class="fas fa-microchip"></i>
                                        <div>
                                            <label>KeyChip</label>
                                            <div class="binding-value sensitive-data" data-field="keychip">-</div>
                                        </div>
                                    </div>
                                    <div class="binding-item">
                                        <i class="fas fa-id-badge"></i>
                                        <div>
                                            <label data-i18n="userSettings.cardNumber">游戏卡号</label>
                                            <div class="binding-value sensitive-data" data-field="guid">-</div>
                                        </div>
                                    </div>
                                </div>
                                <div class="no-binding-hint" style="display: none;">
                                    <p class="text-muted text-center">
                                        <i class="fas fa-info-circle"></i>
                                        <span data-i18n="ccb.cardNotBound">该卡片尚未绑定</span>
                                    </p>
                                </div>
                                <button class="btn-danger btn-block ccb-unbind-btn" data-slot="3"
                                        style="display: none;">
                                    <i class="fas fa-unlink"></i> <span
                                    data-i18n="userSettings.unbindCard">解绑卡片</span>
                                </button>
                            </div>

                            <!-- 前往查分页按钮 -->
                            <button class="btn-primary btn-block mt-3" onclick="loadPage('ccb')">
                                <i class="fas fa-chart-line"></i> <span
                                data-i18n="userSettings.goToCcbPage">前往查分页</span>
                            </button>
                        </div>
                    </div>

                    <!-- 无查分绑定提示 -->
                    <div class="settings-card" id="no-binding-message" style="display: none;">
                        <div class="card-body text-center">
                            <i class="fas fa-gamepad empty-icon"></i>
                            <h4 data-i18n="userSettings.noCcbBinding">暂无查分绑定</h4>
                            <p class="text-muted mt-2" data-i18n="userSettings.goToBindHint">
                                前往游戏查分页面进行绑定</p>
                            <button class="btn-primary mt-3" onclick="loadPage('ccb')">
                                <i class="fas fa-link"></i> <span data-i18n="userSettings.goToBind">前往绑定</span>
                            </button>
                        </div>
                    </div>

                    <!-- 收货信息卡片 -->
                    <div class="settings-card" id="shipping-binding-section" style="display: none;">
                        <div class="card-header">
                            <h3>
                                <i class="fas fa-truck"></i>
                                <span data-i18n="userSettings.shippingInfo">收货绑定信息</span>
                            </h3>
                            <button id="shipping-visibility-toggle" class="visibility-toggle-btn"
                                    title="隐藏/显示收货信息">
                                <i class="fas fa-eye"></i>
                            </button>
                        </div>
                        <div class="card-body">
                            <div class="binding-info">
                                <div class="binding-item">
                                    <i class="fas fa-user"></i>
                                    <div>
                                        <label data-i18n="userSettings.recipient">收件人</label>
                                        <div class="binding-value sensitive-data" data-field="name" id="shipping-name">
                                            -
                                        </div>
                                    </div>
                                </div>
                                <div class="binding-item">
                                    <i class="fas fa-phone"></i>
                                    <div>
                                        <label data-i18n="userSettings.phone">联系电话</label>
                                        <div class="binding-value sensitive-data" data-field="phone"
                                             id="shipping-phone">-
                                        </div>
                                    </div>
                                </div>
                                <div class="binding-item">
                                    <i class="fas fa-map-marker-alt"></i>
                                    <div>
                                        <label data-i18n="userSettings.address">收货地址</label>
                                        <div class="binding-value sensitive-data" data-field="address"
                                             id="shipping-address">-
                                        </div>
                                    </div>
                                </div>
                                <div class="binding-item">
                                    <i class="fas fa-shopping-cart"></i>
                                    <div>
                                        <label data-i18n="orderEntry.taobaoId">淘宝ID</label>
                                        <div class="binding-value sensitive-data" data-field="postal_code"
                                             id="shipping-postal-code">-
                                        </div>
                                    </div>
                                </div>
                            </div>
                            <button id="unbind-shipping-btn" class="btn-danger btn-block">
                                <i class="fas fa-unlink"></i> <span
                                data-i18n="userSettings.unbindShipping">解绑收货信息</span>
                            </button>
                        </div>
                    </div>

                    <!-- 无收货信息提示 -->
                    <div class="settings-card" id="no-shipping-message" style="display: none;">
                        <div class="card-body text-center">
                            <i class="fas fa-box-open empty-icon"></i>
                            <h4 data-i18n="userSettings.noShippingBinding">暂无收货绑定</h4>
                            <p class="text-muted mt-2" data-i18n="userSettings.needBindingForShop">
                                需要先绑定收货信息才能使用积分商城</p>
                            <button id="add-shipping-btn" class="btn-primary mt-3">
                                <i class="fas fa-link"></i> <span data-i18n="userSettings.goToBind">前往绑定</span>
                            </button>
                        </div>
                    </div>
                </div>

                <!-- 隐私设置选项卡 -->
                <div class="tab-content" id="privacy-tab">
                    <div class="settings-card">
                        <div class="card-header">
                            <h3><i class="fas fa-user-shield"></i> <span
                                data-i18n="userSettings.privacySettings">隐私设置</span></h3>
                        </div>
                        <div class="card-body">
                            <div class="privacy-option">
                                <div class="privacy-option-title">
                                    <i class="fas fa-search"></i>
                                    <span data-i18n="userSettings.searchBy">允许通过以下方式被搜索</span>
                                </div>
                                <div class="privacy-checkboxes">
                                    <div class="privacy-checkbox">
                                        <input type="checkbox" id="search-by-uid" value="uid" checked>
                                        <label for="search-by-uid">UID</label>
                                    </div>
                                    <div class="privacy-checkbox">
                                        <input type="checkbox" id="search-by-username" value="username" checked>
                                        <label for="search-by-username" data-i18n="userSettings.username">用户名</label>
                                    </div>
                                    <div class="privacy-checkbox">
                                        <input type="checkbox" id="search-by-nickname" value="nickname" checked>
                                        <label for="search-by-nickname" data-i18n="auth.nickname">昵称</label>
                                    </div>
                                </div>
                            </div>

                            <div class="privacy-option">
                                <div class="privacy-option-title">
                                    <i class="fas fa-envelope"></i>
                                    <span data-i18n="userSettings.messageReceive">消息接收设置</span>
                                </div>
                                <div class="privacy-radio-group">
                                    <div class="privacy-radio">
                                        <input type="radio" id="msg-all" name="message-privacy" value="all" checked>
                                        <label for="msg-all"
                                               data-i18n="userSettings.receiveAll">接收所有人的消息</label>
                                    </div>
                                    <div class="privacy-radio">
                                        <input type="radio" id="msg-friends" name="message-privacy" value="friends">
                                        <label for="msg-friends"
                                               data-i18n="userSettings.receiveFriendsOnly">仅接收好友的消息</label>
                                    </div>
                                    <div class="privacy-radio">
                                        <input type="radio" id="msg-none" name="message-privacy" value="none">
                                        <label for="msg-none"
                                               data-i18n="userSettings.receiveNone">不接收任何消息</label>
                                    </div>
                                </div>
                            </div>

                            <button id="save-privacy-btn" class="btn-primary btn-block">
                                <i class="fas fa-save"></i> <span
                                data-i18n="userSettings.savePrivacy">保存隐私设置</span>
                            </button>
                        </div>
                    </div>
                </div>
            </div>
        </div>
    </div>
</template>

<style scoped>

</style>