import React, { useState } from 'react';
import { FaUserPlus, FaComments, FaBell, FaSearch, FaSignOutAlt, FaUserSlash } from 'react-icons/fa';
import ThemeToggle from './ThemeToggle';
import { useChatState } from '../context/ChatProvider';
import axios from 'axios';
import { toast } from 'react-toastify';
import { API_BASE_URL } from '../config';
import ProfileModal from './ProfileModal';
import ConfirmModal from './ConfirmModal';

const Sidebar = ({
    myFriends,
    friendRequests,
    onlineUsers,
    fetchFriends,
    fetchFriendRequests,
    setShowSidebar,
    isUserOnline,
    getInitials,
    onSelectChat,
    notification = [],
}) => {
    const { user, setSelectedChat, selectedChat } = useChatState();
    const [tab, setTab] = useState('friends');
    const [search, setSearch] = useState("");
    const [searchResult, setSearchResult] = useState([]);
    const [searching, setSearching] = useState(false);
    const [isProfileOpen, setIsProfileOpen] = useState(false);
    const [removePending, setRemovePending] = useState(null); // { id, name }

    const handleSearch = async (query) => {
        setSearch(query);
        if (!query.trim()) {
            setSearchResult([]);
            setTab('friends');
            return;
        }
        setTab('search');
        setSearching(true);
        try {
            const config = { headers: { Authorization: `Bearer ${user.token}` } };
            const { data } = await axios.get(`${API_BASE_URL}/api/users/search?search=${query}`, config);
            setSearchResult(data);
        } catch {
            toast.error("Search failed");
        }
        setSearching(false);
    };

    const clearSearch = () => {
        setSearch("");
        setSearchResult([]);
        setTab('friends');
    };

    const sendRequest = async (userId) => {
        try {
            const config = {
                headers: {
                    Authorization: `Bearer ${user.token}`,
                    "Content-type": "application/json"
                }
            };
            await axios.post(`${API_BASE_URL}/api/users/friend-request`, { receiverId: userId }, config);
            toast.success("Friend request sent!");
        } catch (error) {
            toast.error(error.response?.data?.message || "Error sending request");
        }
    };

    const handleRemoveFriend = (friendId, friendName, e) => {
        e?.stopPropagation();
        // Open the custom themed confirm modal instead of window.confirm
        setRemovePending({ id: friendId, name: friendName });
    };

    const confirmRemoveFriend = async () => {
        if (!removePending) return;
        const friendId = removePending.id;
        setRemovePending(null);

        try {
            const config = {
                headers: {
                    Authorization: `Bearer ${user.token}`,
                    "Content-type": "application/json"
                }
            };
            await axios.post(`${API_BASE_URL}/api/users/remove-friend`, { friendId }, config);
            toast.success("Friend removed and vault wiped.");

            if (selectedChat?._id === friendId) {
                setSelectedChat(null);
            }
            fetchFriends();
        } catch (error) {
            toast.error(error.response?.data?.message || "Error removing friend");
        }
    };

    const respondRequest = async (senderId, action) => {
        try {
            const config = {
                headers: {
                    Authorization: `Bearer ${user.token}`,
                    "Content-type": "application/json"
                }
            };
            await axios.post(`${API_BASE_URL}/api/users/friend-request/respond`, { senderId, action }, config);
            toast.success(action === 'accept' ? "Friend added! 🎉" : "Request declined");
            fetchFriendRequests();
            if (action === 'accept') fetchFriends();
        } catch {
            toast.error("Error responding to request");
        }
    };

    const logout = () => {
        localStorage.removeItem('userInfo');
        window.location.href = '/';
    };

    const handleSelectFriend = (friend) => {
        if (onSelectChat) {
            onSelectChat(friend);
        } else {
            setSelectedChat(friend);
            setShowSidebar(false);
        }
    };

    return (
        <div className="flex flex-col h-full bg-white dark:bg-gray-900
                        border-r border-gray-100 dark:border-gray-800
                        shadow-xl overflow-hidden">

            <ProfileModal isOpen={isProfileOpen} onClose={() => setIsProfileOpen(false)} />

            <ConfirmModal
                isOpen={!!removePending}
                title={`Remove ${removePending?.name}?`}
                message={`You will no longer be friends. All shared chat messages and vault media will be permanently deleted.`}
                confirmText="Remove & Delete"
                danger={true}
                onConfirm={confirmRemoveFriend}
                onCancel={() => setRemovePending(null)}
            />

            {/* ── Header: avatar + name + actions ── */}
            <div className="header-container flex items-center justify-between
                            px-4 py-3
                            bg-white/80 dark:bg-gray-900/80 backdrop-blur-md
                            border-b border-gray-100 dark:border-gray-800">

                {/* User info */}
                <div
                    onClick={() => setIsProfileOpen(true)}
                    className="flex items-center space-x-3 min-w-0 cursor-pointer hover:opacity-80 transition-opacity"
                >
                    <div className="relative flex-shrink-0">
                        <div className="w-10 h-10 rounded-2xl bg-gradient-to-tr from-indigo-600 to-purple-600
                                        flex items-center justify-center text-white font-bold text-base
                                        shadow-md ring-2 ring-white dark:ring-gray-800">
                            {getInitials(user?.name)}
                        </div>
                        {/* Online indicator */}
                        <div className="absolute -bottom-0.5 -right-0.5 w-3 h-3 bg-green-500
                                        border-2 border-white dark:border-gray-900 rounded-full" />
                    </div>
                    <div className="min-w-0">
                        <h2 className="font-bold text-gray-800 dark:text-gray-100 truncate
                                       text-sm tracking-tight max-w-[120px] sm:max-w-[160px]">
                            {user?.name}
                        </h2>
                        <span className="text-[10px] text-green-500 font-bold uppercase tracking-widest">
                            Online
                        </span>
                    </div>
                </div>

                {/* Action buttons */}
                <div className="flex items-center space-x-1 flex-shrink-0">
                    <ThemeToggle />
                    <button
                        onClick={logout}
                        className="w-9 h-9 flex items-center justify-center
                                   text-gray-400 hover:text-red-500
                                   hover:bg-red-50 dark:hover:bg-red-900/20
                                   rounded-full transition-colors touch-manipulation"
                        title="Logout"
                        aria-label="Logout"
                    >
                        <FaSignOutAlt className="text-sm" />
                    </button>
                </div>
            </div>

            {/* ── Search bar ── */}
            <div className="flex-shrink-0 px-4 pt-3 pb-2">
                <div className="relative">
                    <FaSearch className="absolute left-3.5 top-1/2 -translate-y-1/2 text-gray-400 text-sm pointer-events-none" />
                    <input
                        type="search"
                        inputMode="search"
                        placeholder="Search people…"
                        className="w-full bg-gray-100 dark:bg-gray-800
                                   border-none rounded-2xl
                                   py-3 pl-10 pr-10
                                   focus:outline-none focus:ring-2 focus:ring-indigo-500
                                   transition-all text-gray-800 dark:text-gray-100
                                   placeholder:text-gray-400
                                   touch-manipulation"
                        value={search}
                        onChange={(e) => handleSearch(e.target.value)}
                    />
                    {search && (
                        <button
                            onClick={clearSearch}
                            className="absolute right-3 top-1/2 -translate-y-1/2
                                       w-6 h-6 flex items-center justify-center
                                       text-gray-400 hover:text-gray-600
                                       rounded-full touch-manipulation"
                        >
                            ✕
                        </button>
                    )}
                </div>
            </div>

            {/* ── Tab switcher (Chats / Requests) ── */}
            {tab !== 'search' && (
                <div className="flex-shrink-0 flex px-4 space-x-2 pb-2">
                    <button
                        onClick={() => setTab('friends')}
                        className={`flex-1 py-2.5 rounded-xl flex items-center justify-center space-x-2
                                    transition-all text-sm font-bold touch-manipulation
                                    ${tab === 'friends'
                                ? 'bg-indigo-600 text-white shadow-lg shadow-indigo-600/20'
                                : 'text-gray-500 dark:text-gray-400 hover:bg-gray-100 dark:hover:bg-gray-800'}`}
                    >
                        <FaComments />
                        <span>Chats</span>
                    </button>
                    <button
                        onClick={() => setTab('requests')}
                        className={`flex-1 py-2.5 rounded-xl relative flex items-center justify-center space-x-2
                                    transition-all text-sm font-bold touch-manipulation
                                    ${tab === 'requests'
                                ? 'bg-indigo-600 text-white shadow-lg shadow-indigo-600/20'
                                : 'text-gray-500 dark:text-gray-400 hover:bg-gray-100 dark:hover:bg-gray-800'}`}
                    >
                        <FaBell />
                        <span>Requests</span>
                        {friendRequests.length > 0 && (
                            <span className="absolute -top-1.5 -right-1.5 w-5 h-5 bg-red-500 text-white
                                             text-[10px] flex items-center justify-center rounded-full
                                             border-2 border-white dark:border-gray-900 font-black animate-bounce">
                                {friendRequests.length > 9 ? '9+' : friendRequests.length}
                            </span>
                        )}
                    </button>
                </div>
            )}

            {/* ── Scrollable content ── */}
            <div className="flex-1 overflow-y-auto chat-scroll">

                {/* Friends list */}
                {tab === 'friends' && (
                    <div className="px-2 pb-4 space-y-1">
                        {myFriends.length === 0 ? (
                            <div className="flex flex-col items-center justify-center py-16 text-center px-6">
                                <div className="w-16 h-16 bg-indigo-50 dark:bg-indigo-900/20 rounded-full
                                                flex items-center justify-center mb-4">
                                    <FaComments className="text-2xl text-indigo-400" />
                                </div>
                                <p className="text-gray-400 text-sm font-medium">No friends yet</p>
                                <p className="text-gray-300 dark:text-gray-600 text-xs mt-1">
                                    Search for people to add them
                                </p>
                            </div>
                        ) : (
                            myFriends.map((friend) => (
                                <div
                                    key={friend._id}
                                    onClick={() => handleSelectFriend(friend)}
                                    className={`
                                        flex items-center space-x-3 px-3 py-3.5 rounded-2xl
                                        cursor-pointer transition-all duration-150 touch-manipulation
                                        active:scale-[0.98]
                                        ${selectedChat?._id === friend._id
                                            ? 'bg-indigo-50 dark:bg-indigo-900/30'
                                            : 'hover:bg-gray-50 dark:hover:bg-gray-800/60'}
                                    `}
                                >
                                    {/* Avatar */}
                                    <div className="relative flex-shrink-0">
                                        <div className="w-12 h-12 rounded-2xl bg-indigo-100 dark:bg-gray-700
                                                        text-indigo-600 dark:text-indigo-400
                                                        flex items-center justify-center font-black text-base">
                                            {getInitials(friend.name)}
                                        </div>
                                        {isUserOnline(friend._id) && (
                                            <div className="absolute bottom-0 right-0 w-3.5 h-3.5 bg-green-500
                                                            border-2 border-white dark:border-gray-900 rounded-full" />
                                        )}
                                    </div>

                                    {/* Name + status */}
                                    <div className="flex-1 min-w-0">
                                        <div className="flex items-center justify-between">
                                            <h3 className="font-bold text-gray-800 dark:text-gray-200
                                                           text-sm truncate">
                                                {friend.name}
                                            </h3>
                                            <div className="flex items-center space-x-2 flex-shrink-0">
                                                {isUserOnline(friend._id) && (
                                                    <span className="text-[9px] text-green-500 font-bold
                                                                     uppercase tracking-widest">
                                                        Online
                                                    </span>
                                                )}
                                                <button
                                                    onClick={(e) => handleRemoveFriend(friend._id, friend.name, e)}
                                                    className="w-8 h-8 flex items-center justify-center text-gray-300
                                                               hover:text-red-500 hover:bg-red-50 dark:hover:bg-red-900/20
                                                               rounded-lg transition-all active:scale-90"
                                                    title="Remove Friend"
                                                >
                                                    <FaUserSlash size={14} />
                                                </button>
                                            </div>
                                        </div>
                                        <p className="text-xs text-gray-400 dark:text-gray-500 truncate mt-0.5">
                                            Tap to chat
                                        </p>
                                    </div>
                                </div>
                            ))
                        )}
                    </div>
                )}

                {/* Friend requests */}
                {tab === 'requests' && (
                    <div className="px-3 pb-4 space-y-3 pt-1">
                        {friendRequests.length === 0 ? (
                            <div className="flex flex-col items-center justify-center py-16 text-center">
                                <div className="w-16 h-16 bg-gray-50 dark:bg-gray-800 rounded-full
                                                flex items-center justify-center mb-4">
                                    <FaBell className="text-2xl text-gray-300 dark:text-gray-600" />
                                </div>
                                <p className="text-gray-400 text-sm font-medium">All caught up!</p>
                                <p className="text-gray-300 dark:text-gray-600 text-xs mt-1">
                                    No pending requests
                                </p>
                            </div>
                        ) : (
                            friendRequests.map((req) => (
                                <div key={req._id}
                                    className="p-4 bg-gray-50 dark:bg-gray-800/60 rounded-2xl
                                               border border-gray-100 dark:border-gray-700/50">
                                    <div className="flex items-center space-x-3 mb-3">
                                        <div className="w-10 h-10 rounded-xl bg-indigo-100 dark:bg-indigo-900/30
                                                        text-indigo-600 dark:text-indigo-400
                                                        flex items-center justify-center font-bold text-sm flex-shrink-0">
                                            {getInitials(req.name)}
                                        </div>
                                        <div className="min-w-0">
                                            <h3 className="font-bold text-gray-800 dark:text-gray-200 text-sm truncate">
                                                {req.name}
                                            </h3>
                                            <p className="text-[11px] text-gray-400 truncate">{req.email}</p>
                                        </div>
                                    </div>
                                    <div className="flex space-x-2">
                                        <button
                                            onClick={() => respondRequest(req._id, 'accept')}
                                            className="flex-1 py-2.5 bg-indigo-600 text-white rounded-xl
                                                       text-xs font-bold transition-all
                                                       hover:bg-indigo-700 active:scale-95 touch-manipulation"
                                        >
                                            Accept
                                        </button>
                                        <button
                                            onClick={() => respondRequest(req._id, 'reject')}
                                            className="flex-1 py-2.5 bg-gray-200 dark:bg-gray-700
                                                       text-gray-600 dark:text-gray-300 rounded-xl
                                                       text-xs font-bold transition-all
                                                       hover:bg-red-100 hover:text-red-600 active:scale-95 touch-manipulation"
                                        >
                                            Decline
                                        </button>
                                    </div>
                                </div>
                            ))
                        )}
                    </div>
                )}

                {/* Search results */}
                {tab === 'search' && (
                    <div className="px-3 pb-4 pt-1">
                        {/* Back to chats hint */}
                        <p className="text-xs text-gray-400 font-medium mb-3 px-1">
                            Search results for "<span className="text-indigo-500">{search}</span>"
                        </p>

                        {searching && (
                            <div className="flex justify-center py-8">
                                <svg className="animate-spin h-6 w-6 text-indigo-500" fill="none" viewBox="0 0 24 24">
                                    <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4" />
                                    <path className="opacity-75" fill="currentColor"
                                        d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z" />
                                </svg>
                            </div>
                        )}

                        {!searching && searchResult.length === 0 && (
                            <div className="text-center py-10">
                                <p className="text-gray-400 text-sm">No users found</p>
                            </div>
                        )}

                        <div className="space-y-2">
                            {searchResult.slice(0, 15).map((u) => (
                                <div key={u._id}
                                    className="flex items-center justify-between p-3
                                               bg-white dark:bg-gray-800/60 rounded-2xl
                                               border border-gray-100 dark:border-gray-700/50
                                               shadow-sm">
                                    <div className="flex items-center space-x-3 min-w-0">
                                        <div className="w-10 h-10 rounded-xl bg-gray-100 dark:bg-gray-700
                                                        flex items-center justify-center font-bold text-indigo-500
                                                        text-sm flex-shrink-0">
                                            {getInitials(u.name)}
                                        </div>
                                        <div className="min-w-0">
                                            <h3 className="font-bold text-gray-800 dark:text-gray-200 text-sm truncate">
                                                {u.name}
                                            </h3>
                                            <p className="text-[11px] text-gray-400 truncate">{u.email}</p>
                                        </div>
                                    </div>
                                    <button
                                        onClick={() => sendRequest(u._id)}
                                        className="flex-shrink-0 ml-2 w-9 h-9 flex items-center justify-center
                                                   bg-indigo-50 dark:bg-indigo-900/30
                                                   text-indigo-600 dark:text-indigo-400
                                                   rounded-xl hover:bg-indigo-600 hover:text-white
                                                   transition-all active:scale-90 touch-manipulation"
                                        title="Send Friend Request"
                                        aria-label="Add friend"
                                    >
                                        <FaUserPlus className="text-sm" />
                                    </button>
                                </div>
                            ))}
                        </div>
                    </div>
                )}
            </div>
        </div>
    );
};

export default React.memo(Sidebar);
