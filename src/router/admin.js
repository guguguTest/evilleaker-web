import {PRESET_ADMIN} from '@/router/preset';

// 管理栏目
export default [
    {
        name: 'Admin',
        path: '/admin',
        meta: {title: 'sidebar.admin', icon: 'fas fa-shield-alt'},
        children: [
            {
                name: 'UserAdmin',
                path: '/admin/user-manager',
                component: () => import('@/views/admin/UserManager.vue'),
                meta: {
                    ...PRESET_ADMIN,
                    title: 'sidebar.userManager',
                    icon: 'fas fa-users me-2',
                    rule: 'user-manager'
                }
            },
            {
                name: 'AnnouncementAdmin',
                path: '/admin/announcement',
                component: () => import('@/views/404.vue'),
                meta: {
                    ...PRESET_ADMIN,
                    title: 'sidebar.announcementAdmin',
                    icon: 'fas fa-bullhorn me-2',
                    rule: 'announcement-admin'
                }
            },
            {
                name: 'SiteAdmin',
                path: '/admin/site',
                component: () => import('@/views/404.vue'),
                meta: {
                    ...PRESET_ADMIN,
                    title: 'sidebar.siteAdmin',
                    icon: 'fas fa-cogs me-2',
                    rule: 'site-admin'
                }
            },
            {
                name: 'ForumAdmin',
                path: '/admin/forum',
                component: () => import('@/views/404.vue'),
                meta: {
                    ...PRESET_ADMIN,
                    title: 'sidebar.forumAdmin',
                    icon: 'fas fa-toolbox me-2',
                    rule: 'forum-admin'
                }
            },
            {
                name: 'DownloadAdmin',
                path: '/admin/download',
                component: () => import('@/views/404.vue'),
                meta: {
                    ...PRESET_ADMIN,
                    title: 'sidebar.downloadAdmin',
                    icon: 'fas fa-download me-2',
                    rule: 'download-admin'
                }
            },
            {
                name: 'VerificationAdmin',
                path: '/admin/verification',
                component: () => import('@/views/404.vue'),
                meta: {
                    ...PRESET_ADMIN,
                    title: 'sidebar.verificationAdmin',
                    icon: 'fas fa-tasks me-2',
                    rule: 'verification-admin'
                }
            },
            {
                name: 'PointsShopAdmin',
                path: '/admin/points-shop',
                component: () => import('@/views/404.vue'),
                meta: {
                    ...PRESET_ADMIN,
                    title: 'sidebar.pointsShopAdmin',
                    icon: 'fas fa-coins me-2',
                    rule: 'points-shop-admin'
                }
            },
            {
                name: 'Point2ShopAdmin',
                path: '/admin/point2-shop',
                component: () => import('@/views/404.vue'),
                meta: {
                    ...PRESET_ADMIN,
                    title: 'sidebar.point2ShopAdmin',
                    icon: 'fas fa-dove me-2',
                    rule: 'point2-shop-admin'
                }
            },
            {
                name: 'CreditShopAdmin',
                path: '/admin/credit-shop',
                component: () => import('@/views/404.vue'),
                meta: {
                    ...PRESET_ADMIN,
                    title: 'sidebar.creditShopAdmin',
                    icon: 'fas fa-star me-2'
                }
            },
            {
                name: 'OrderEntry',
                path: '/admin/order-entry',
                component: () => import('@/views/404.vue'),
                meta: {
                    ...PRESET_ADMIN,
                    title: 'sidebar.orderEntry',
                    icon: 'fas fa-file-invoice me-2',
                    rule: 'order-entry'
                }
            }
        ]
    }
];