// src/stores/ccb.js
import { defineStore } from 'pinia';
import {
    apiGetUser,
    apiListServers,
    apiListGames,
    apiBindCard,
    apiUnbindCard,
    apiUnbindAll,
    apiSwitchActive,
    apiQueryScore,
} from '@/api/ccb';

export const useCcbStore = defineStore('ccb', {
    state: () => ({
        servers: [],
        games: [],
        bindings: {
            1: { game_server: null, keychip: null, guid: null },
            2: { game_server: null, keychip: null, guid: null },
            3: { game_server: null, keychip: null, guid: null },
        },
        activeSlot: 1,
        points: 0,
        lastImageDataUrl: '',
        cooldownLeft: 0,
        _cooldownTimer: null,
        loading: false,
        querying: false,
    }),

    getters: {
        isSlotBound: (s) => (slot) => {
            const b = s.bindings[slot];
            return !!(b && b.game_server && b.keychip && b.guid);
        },
        currentBinding: (s) => s.bindings[s.activeSlot],
        currentServerName: (s) => {
            const url = s.currentBinding?.game_server;
            const found = s.servers.find((i) => i.server_url === url);
            return found ? found.server_name : (url || '未知服务器');
        },
    },

    actions: {
        // —— 规范化工具 —— //
        normalizeGuid(v) {
            return String(v || '').replace(/\D/g, '').slice(0, 20);
        },
        normalizeKeychip(v) {
            let x = String(v || '').replace(/[^A-Za-z0-9]/g, '');
            if (x.length === 15) x = x.slice(0, 11); // 兼容 15 位复制
            return x.toUpperCase().slice(0, 11);
        },

        // —— setter（外部组件只调用这些） —— //
        setActiveSlot(slot) {
            if (![1, 2, 3].includes(slot)) return;
            this.$patch({ activeSlot: slot });
        },

        // —— 内部：把后端用户对象映射到本地绑定 —— //
        _applyUserToBindings(user) {
            const b1 = {
                game_server: user.game_server || null,
                keychip: user.keychip || null,
                guid: user.guid || null,
            };
            const b2 = {
                game_server: user.ccb_slot2_server || null,
                keychip: user.ccb_slot2_keychip || null,
                guid: user.ccb_slot2_guid || null,
            };
            const b3 = {
                game_server: user.ccb_slot3_server || null,
                keychip: user.ccb_slot3_keychip || null,
                guid: user.ccb_slot3_guid || null,
            };

            const bound = {
                1: !!(b1.game_server && b1.keychip && b1.guid),
                2: !!(b2.game_server && b2.keychip && b2.guid),
                3: !!(b3.game_server && b3.keychip && b3.guid),
            };
            const prefer = user.ccb_active_slot || this.activeSlot || 1;
            const finalActive = bound[prefer] ? prefer : ([1, 2, 3].find((s) => bound[s]) || 1);

            this.$patch((s) => {
                s.bindings[1] = b1;
                s.bindings[2] = b2;
                s.bindings[3] = b3;
                s.activeSlot = finalActive;
                s.points = user.points || 0;
            });
        },

        // —— 生命周期 —— //
        async bootstrap() {
            this.$patch({ loading: true });
            try {
                const [servers, games, user] = await Promise.all([
                    apiListServers(),
                    apiListGames(),
                    apiGetUser(),
                ]);
                this.$patch({
                    servers: Array.isArray(servers) ? servers : [],
                    games: Array.isArray(games) ? games : [],
                });
                this._applyUserToBindings(user);
            } finally {
                this.$patch({ loading: false });
            }
        },

        async refreshPoints() {
            const user = await apiGetUser();
            this.$patch({ points: user.points || 0 });
        },

        // —— 绑定相关 —— //
        async bindCard({ slot, game_server, keychip, guid }) {
            await apiBindCard({ slot, game_server, keychip, guid });
            this.$patch((s) => {
                s.bindings[slot] = { game_server, keychip, guid };
            });
        },

        async unbindSlot(slot) {
            await apiUnbindCard(slot);
            this.$patch((s) => {
                s.bindings[slot] = { game_server: null, keychip: null, guid: null };
            });
            // 若解绑了当前槽，切到仍绑定的第一个槽
            const firstBound = [1, 2, 3].find((i) => this.isSlotBound(i)) || 1;
            this.$patch({ activeSlot: firstBound });
        },

        async unbindAll() {
            await apiUnbindAll();
            this.$patch((s) => {
                [1, 2, 3].forEach((i) => (s.bindings[i] = { game_server: null, keychip: null, guid: null }));
                s.activeSlot = 1;
            });
        },

        async switchActive(slot) {
            await apiSwitchActive(slot);
            this.$patch({ activeSlot: slot });
        },

        // —— 查分（含扣分与冷却） —— //
        async queryScore(game) {
            if (this.cooldownLeft > 0) throw new Error('查询冷却中，请稍后再试');
            if (!game) throw new Error('请选择游戏');
            if ((this.points || 0) < 1) throw new Error('积分不足，需 1 积分');

            this.$patch({ querying: true });
            try {
                const data = await apiQueryScore({ game, slot: this.activeSlot });
                if (data.status === 'ok' && data.image_base64) {
                    this.$patch({
                        lastImageDataUrl: `data:image/png;base64,${data.image_base64}`,
                        points: Math.max(0, (this.points || 0) - 1),
                    });
                    this._startCooldown(10);
                } else {
                    throw new Error(data.error || '查询失败');
                }
            } finally {
                this.$patch({ querying: false });
            }
        },

        _startCooldown(sec) {
            this._clearCooldown();
            this.$patch({ cooldownLeft: sec });
            this._cooldownTimer = setInterval(() => {
                const left = this.cooldownLeft - 1;
                if (left <= 0) {
                    this._clearCooldown();
                } else {
                    this.$patch({ cooldownLeft: left });
                }
            }, 1000);
        },
        _clearCooldown() {
            if (this._cooldownTimer) {
                clearInterval(this._cooldownTimer);
                this._cooldownTimer = null;
            }
            this.$patch({ cooldownLeft: 0 });
        },
    },
});
