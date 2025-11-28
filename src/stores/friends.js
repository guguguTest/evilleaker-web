// src/stores/friends.js
import {defineStore} from 'pinia';
import {ref} from 'vue';
import {
    getFriends,
    getBlacklist,
    getFriendRequests,
    searchUsers,
    sendFriendRequest,
    acceptFriendRequest,
    rejectFriendRequest,
    removeFriend,
    addToBlacklist,
    removeFromBlacklist,
    getFriendPrivacy,
    updateFriendPrivacy,
} from '@/api/friends';

export const useFriendsStore = defineStore('friends', () => {
    const friends = ref([]);
    const blacklist = ref([]);
    const requests = ref([]);
    const loading = ref(false);
    const activeTab = ref('friends'); // friends / blacklist / add / settings
    const searchKeyword = ref('');
    const searchResults = ref([]);
    const privacy = ref({
        searchable_by: 'all',
        message_privacy: 'all',
    });

    function setFriends(list) {
        friends.value = list || [];
    }

    function setBlacklist(list) {
        blacklist.value = list || [];
    }

    function setRequests(list) {
        requests.value = list || [];
    }

    function setActiveTab(tab) {
        activeTab.value = tab;
    }

    function setSearchKeyword(keyword) {
        searchKeyword.value = keyword;
    }

    function setSearchResults(list) {
        searchResults.value = list || [];
    }

    function setPrivacy(val) {
        privacy.value = val || privacy.value;
    }

    async function refreshAll() {
        loading.value = true;
        try {
            const [friendsRes, blacklistRes, requestsRes, privacyRes] =
                await Promise.all([
                    getFriends(),
                    getBlacklist(),
                    getFriendRequests(),
                    getFriendPrivacy().catch(() => null),
                ]);
            setFriends(friendsRes);
            setBlacklist(blacklistRes);
            setRequests(requestsRes);
            if (privacyRes) setPrivacy(privacyRes);
        } finally {
            loading.value = false;
        }
    }

    async function refreshFriendsOnly() {
        const res = await getFriends();
        setFriends(res);
    }

    async function performSearch() {
        if (!searchKeyword.value.trim()) {
            setSearchResults([]);
            return;
        }
        const res = await searchUsers(searchKeyword.value.trim());
        setSearchResults(res);
    }

    async function sendRequestTo(userId) {
        await sendFriendRequest(userId);
        await refreshAll();
    }

    async function acceptRequest(id) {
        await acceptFriendRequest(id);
        await refreshAll();
    }

    async function rejectRequest(id) {
        await rejectFriendRequest(id);
        await refreshAll();
    }

    async function removeFriendById(userId) {
        await removeFriend(userId);
        await refreshAll();
    }

    async function blockUser(userId) {
        await addToBlacklist(userId);
        await refreshAll();
    }

    async function unblockUser(userId) {
        await removeFromBlacklist(userId);
        await refreshAll();
    }

    async function savePrivacy() {
        await updateFriendPrivacy(privacy.value);
    }

    return {
        friends,
        blacklist,
        requests,
        loading,
        activeTab,
        searchKeyword,
        searchResults,
        privacy,

        setFriends,
        setBlacklist,
        setRequests,
        setActiveTab,
        setSearchKeyword,
        setSearchResults,
        setPrivacy,

        refreshAll,
        refreshFriendsOnly,
        performSearch,
        sendRequestTo,
        acceptRequest,
        rejectRequest,
        removeFriendById,
        blockUser,
        unblockUser,
        savePrivacy,
    };
});
