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
        bindings: { 1: { game_server:null, keychip:null, guid:null },
            2: { game_server:null, keychip:null, guid:null },
            3: { game_server:null, keychip:null, guid:null } },
        activeSlot: 1,
        points: 0,
        lastImageDataUrl: '',
        cooldownLeft: 0,
        _cooldownTimer: null,
        _queryAbort: null,          // <-- 新增：查分可取消
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
            const found = s.servers.find(i => i.server_url === url);
            return found ? found.server_name : (url || '未知服务器');
        },
    },

    actions: {
        // 规范化
        normalizeGuid(v) { return String(v || '').replace(/\D/g, '').slice(0, 20); },
        normalizeKeychip(v) {
            let x = String(v || '').replace(/[^A-Za-z0-9]/g, '');
            if (x.length === 15) x = x.slice(0, 11);
            return x.toUpperCase().slice(0, 11);
        },

        // setter
        setActiveSlot(slot) { if ([1,2,3].includes(slot)) this.$patch({ activeSlot: slot }); },
        resetResult() { this.$patch({ lastImageDataUrl: '' }); },

        // 把 /api/user 映射到本地
        _applyUserToBindings(user) {
            const b1 = { game_server:user.game_server||null, keychip:user.keychip||null, guid:user.guid||null };
            const b2 = { game_server:user.ccb_slot2_server||null, keychip:user.ccb_slot2_keychip||null, guid:user.ccb_slot2_guid||null };
            const b3 = { game_server:user.ccb_slot3_server||null, keychip:user.ccb_slot3_keychip||null, guid:user.ccb_slot3_guid||null };

            const bound = { 1: !!(b1.game_server&&b1.keychip&&b1.guid),
                2: !!(b2.game_server&&b2.keychip&&b2.guid),
                3: !!(b3.game_server&&b3.keychip&&b3.guid) };
            const prefer = user.ccb_active_slot || this.activeSlot || 1;
            const finalActive = bound[prefer] ? prefer : ([1,2,3].find(s => bound[s]) || 1);

            this.$patch(s => {
                s.bindings[1] = b1; s.bindings[2] = b2; s.bindings[3] = b3;
                s.activeSlot = finalActive;
                s.points = user.points || 0;
            });
        },

        // 初始化
        async bootstrap() {
            this.$patch({ loading: true });
            try {
                const [servers, games, user] = await Promise.allSettled([
                    apiListServers(), apiListGames(), apiGetUser()
                ]);
                this.$patch({
                    servers: servers.status==='fulfilled' && Array.isArray(servers.value) ? servers.value : [],
                    games:   games.status==='fulfilled' && Array.isArray(games.value) ? games.value : [],
                });
                if (user.status==='fulfilled' && user.value) this._applyUserToBindings(user.value);
            } finally { this.$patch({ loading: false }); }
        },

        async refreshPoints() {
            const user = await apiGetUser();
            this.$patch({ points: user.points || 0 });
        },

        // 绑定/解绑/切换
        async bindCard({ slot, game_server, keychip, guid }) {
            await apiBindCard({ slot, game_server, keychip, guid });
            this.$patch(s => { s.bindings[slot] = { game_server, keychip, guid }; });
        },
        async unbindSlot(slot) {
            await apiUnbindCard(slot);
            this.$patch(s => { s.bindings[slot] = { game_server:null, keychip:null, guid:null }; });
            const firstBound = [1,2,3].find(i => this.isSlotBound(i)) || 1;
            this.$patch({ activeSlot: firstBound });
        },
        async unbindAll() {
            await apiUnbindAll();
            this.$patch(s => {
                [1,2,3].forEach(i => (s.bindings[i] = { game_server:null, keychip:null, guid:null }));
                s.activeSlot = 1;
            });
        },
        async switchActive(slot) {
            await apiSwitchActive(slot);
            this.$patch({ activeSlot: slot });
        },

        // base64 → dataURL 归一化
        _toDataUrl(raw) {
            if (!raw) return '';
            const str = String(raw).trim().replace(/\s+/g, ''); // 去掉换行空格
            if (str.startsWith('data:image/')) return str;
            const head = str.slice(0, 16);
            let mime = 'image/png';
            if (head.startsWith('/9j/')) mime = 'image/jpeg';
            else if (head.startsWith('iVBORw0KGgo')) mime = 'image/png';
            return `data:${mime};base64,${str}`;
        },

        // 查分（可取消）
        cancelQuery() {
            if (this._queryAbort) {
                this._queryAbort.abort();
                this._queryAbort = null;
                this.$patch({ querying: false });
            }
        },
        async queryScore(game) {
            if (this.cooldownLeft > 0) throw new Error('查询冷却中，请稍后再试');
            if (!game) throw new Error('请选择游戏');
            if ((this.points || 0) < 1) throw new Error('积分不足，需 1 积分');

            this.$patch({ querying: true });
            const ctrl = new AbortController();
            this._queryAbort = ctrl;
            try {
                const payload = await apiQueryScore({ game, slot: this.activeSlot, signal: ctrl.signal });
                const raw = payload?.image_base64 || payload?.image || payload?.dataUrl || payload?.result || '';
                const url = this._toDataUrl(raw);
                if (!url) throw new Error('查询返回了空的图片数据');

                this.$patch({
                    lastImageDataUrl: url,
                    points: Math.max(0, (this.points || 0) - 1),
                });
                this._startCooldown(10);
            } finally {
                this._queryAbort = null;
                this.$patch({ querying: false });
            }
        },

        _startCooldown(sec) {
            this._clearCooldown();
            this.$patch({ cooldownLeft: sec });
            this._cooldownTimer = setInterval(() => {
                const left = this.cooldownLeft - 1;
                if (left <= 0) this._clearCooldown(); else this.$patch({ cooldownLeft: left });
            }, 1000);
        },
        _clearCooldown() {
            if (this._cooldownTimer) { clearInterval(this._cooldownTimer); this._cooldownTimer = null; }
            this.$patch({ cooldownLeft: 0 });
        },
    },
});
