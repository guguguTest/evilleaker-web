// 这里是一些权限预设

const RANK_ALL = [0, 1, 2, 3, 4, 5];
const RANK_ONLY_5 = [5];

// 所有人都能看到的界面
export const PRESET_ALL = {
    rank: RANK_ALL,
    needLogin: false,
    ban: [0, 1, 2],
};

// 只要能录且BS0就能看到
export const PRESET_LOGIN_BS0 = {
    rank: RANK_ALL,
    needLogin: true,
    ban: [0],
};

// 只要能录且BS0/1就能看到
export const PRESET_LOGIN_BS1 = {
    rank: RANK_ALL,
    needLogin: true,
    ban: [0, 1],
};

// 只有管理员才能看
export const PRESET_ADMIN = {
    rank: RANK_ONLY_5,
    needLogin: true,
    ban: [0],
};
