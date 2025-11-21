import {computed} from 'vue'
import {useAuthStore} from '@/stores/auth'

const ranks = [
    {
        background: 'https://oss.am-all.com.cn/asset/img/main/dc/UserRank/UserRank_normal.png',
        icon: 'https://oss.am-all.com.cn/asset/img/main/dc/UserRank/UserRank_1.png',
        text: 'userRank[0]'
    },
    {
        background: 'https://oss.am-all.com.cn/asset/img/main/dc/UserRank/UserRank_bronze.png',
        icon: 'https://oss.am-all.com.cn/asset/img/main/dc/UserRank/UserRank_2.png',
        text: 'userRank[1]'
    },
    {
        background: 'https://oss.am-all.com.cn/asset/img/main/dc/UserRank/UserRank_silver.png',
        icon: 'https://oss.am-all.com.cn/asset/img/main/dc/UserRank/UserRank_3.png',
        text: 'userRank[2]'
    },
    {
        background: 'https://oss.am-all.com.cn/asset/img/main/dc/UserRank/UserRank_gold.png',
        icon: 'https://oss.am-all.com.cn/asset/img/main/dc/UserRank/UserRank_4.png',
        text: 'userRank[3]'
    },
    {
        background: 'https://oss.am-all.com.cn/asset/img/main/dc/UserRank/UserRank_platinum.png',
        icon: 'https://oss.am-all.com.cn/asset/img/main/dc/UserRank/UserRank_5.png',
        text: 'userRank[4]'
    },
    {
        background: 'https://oss.am-all.com.cn/asset/img/main/dc/UserRank/UserRank_rainbow.png',
        icon: 'https://oss.am-all.com.cn/asset/img/main/dc/UserRank/UserRank_6.png',
        text: 'userRank[5]'
    }
];
const banState = [
    {
        src: 'https://oss.am-all.com.cn/asset/img/other/dc/banState/bs0.png',
        title: '正常'
    },
    {
        src: 'https://oss.am-all.com.cn/asset/img/other/dc/banState/bs1.png',
        title: '受限'
    },
    {
        src: 'https://oss.am-all.com.cn/asset/img/other/dc/banState/bs2.png',
        title: '封禁'
    }
];

export function useUserCompute() {
    const authStore = useAuthStore()

    const userRankInfo = computed(() => {
        return ranks[authStore.user ? authStore.user.user_rank : 0];
    });
    const userBanState = computed(() => {
        return banState[authStore.user ? authStore.user.banState : 0];
    });
    const userSpecialRank = computed(() => {
        const rank = authStore.user ? authStore.user.rankSp : 0;
        return rank === 0 ? null : `specialRank[${rank}]`;
    });
    const userAuth = computed(() => {
        const auth = authStore.user ? authStore.user.account_auth : 0;
        return auth === 0 ? null : `certification[${auth}]`;
    });
    return {userRankInfo, userBanState, userSpecialRank, userAuth}
}