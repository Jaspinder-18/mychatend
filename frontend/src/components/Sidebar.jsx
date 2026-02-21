import React, { useState } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import {
    Users, MessageSquare, Bell, Search, LogOut,
    Shield, UserPlus, X, Trash2, ShieldAlert
} from 'lucide-react';
import { useChatState } from '../context/ChatProvider';
import axios from 'axios';
import { toast } from 'react-toastify';
import { API_BASE_URL } from '../config';
import ProfileModal from './ProfileModal';

const Sidebar = ({
    myFriends,
    friendRequests,
    onlineUsers,
    fetchFriends,
    fetchFriendRequests,
    isUserOnline,
    getInitials,
    onSelectChat,
    notification = [],
}) => {
    const { user, selectedChat, setSelectedChat } = useChatState();
    const [tab, setTab] = useState('friends');
    const [search, setSearch] = useState("");
    const [searchResult, setSearchResult] = useState([]);
    const [searching, setSearching] = useState(false);
    const [isProfileOpen, setIsProfileOpen] = useState(false);

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
            toast.error("Packet scan failed.");
        }
        setSearching(false);
    };

    const logout = () => {
        localStorage.removeItem('userInfo');
        localStorage.removeItem('privateKey');
        window.location.href = '/';
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
            toast.success("Identity bridge requested.");
        } catch (error) {
            toast.error(error.response?.data?.message || "Signal error.");
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
            toast.success(action === 'accept' ? "Secure link established." : "Request purged.");
            fetchFriendRequests();
            if (action === 'accept') fetchFriends();
        } catch {
            toast.error("Transmission error.");
        }
    };

    return (
        <div className="flex flex-col h-full bg-slate-950/80 border-r border-white/5 relative overflow-hidden backdrop-blur-3xl">
            <div className="absolute top-0 right-0 w-32 h-32 bg-indigo-600/5 blur-[100px] pointer-events-none" />

            <ProfileModal isOpen={isProfileOpen} onClose={() => setIsProfileOpen(false)} />

            {/* Header */}
            <header className="p-6 pb-4 flex items-center justify-between">
                <div onClick={() => setIsProfileOpen(true)} className="flex items-center gap-3 cursor-pointer group">
                    <div className="relative">
                        <div className="w-11 h-11 rounded-[1.25rem] bg-indigo-600/20 border border-indigo-500/30 flex items-center justify-center font-bold text-indigo-400 group-hover:scale-105 transition-transform duration-300">
                            {getInitials(user?.username)}
                        </div>
                        <div className="absolute -bottom-0.5 -right-0.5 w-3.5 h-3.5 bg-emerald-500 border-2 border-slate-950 rounded-full" />
                    </div>
                    <div className="min-w-0">
                        <h2 className="font-bold text-white text-sm truncate">{user?.username}</h2>
                        <span className="text-[10px] text-emerald-500 uppercase tracking-widest font-bold">Authenticated</span>
                    </div>
                </div>
                <button
                    onClick={logout}
                    className="p-2.5 text-slate-500 hover:text-red-400 bg-white/5 hover:bg-red-500/10 rounded-xl transition-all duration-300"
                >
                    <LogOut size={18} />
                </button>
            </header>

            {/* Search */}
            <div className="px-6 mb-6">
                <div className="relative group">
                    <Search className="absolute left-4 top-1/2 -translate-y-1/2 text-slate-500 group-focus-within:text-indigo-500 transition-colors" size={16} />
                    <input
                        type="text"
                        placeholder="Scan for identities..."
                        value={search}
                        onChange={(e) => handleSearch(e.target.value)}
                        className="w-full bg-white/5 border border-white/10 rounded-2xl py-3 pl-12 pr-4 text-sm focus:outline-none focus:border-indigo-500/50 transition-all placeholder:text-slate-600"
                    />
                </div>
            </div>

            {/* Tabs */}
            {tab !== 'search' && (
                <div className="px-6 mb-4 flex gap-2">
                    <button
                        onClick={() => setTab('friends')}
                        className={`flex-1 flex items-center justify-center gap-2 py-2.5 rounded-xl text-xs font-bold transition-all duration-300 ${tab === 'friends' ? 'bg-indigo-600 text-white shadow-lg shadow-indigo-600/20' : 'bg-white/5 text-slate-400 hover:text-white'}`}
                    >
                        <MessageSquare size={14} />
                        <span>Sessions</span>
                    </button>
                    <button
                        onClick={() => setTab('requests')}
                        className={`flex-1 flex items-center justify-center gap-2 py-2.5 rounded-xl text-xs font-bold relative transition-all duration-300 ${tab === 'requests' ? 'bg-indigo-600 text-white shadow-lg shadow-indigo-600/20' : 'bg-white/5 text-slate-400 hover:text-white'}`}
                    >
                        <Bell size={14} />
                        <span>Signals</span>
                        {friendRequests.length > 0 && (
                            <span className="absolute -top-1 -right-1 w-5 h-5 bg-red-600 text-white text-[10px] flex items-center justify-center rounded-full border-2 border-slate-950 font-black animate-pulse">
                                {friendRequests.length}
                            </span>
                        )}
                    </button>
                </div>
            )}

            {/* Content Area */}
            <div className="flex-1 overflow-y-auto custom-scrollbar px-3">
                <AnimatePresence mode="wait">
                    {tab === 'friends' && (
                        <motion.div
                            key="friends-list"
                            initial={{ opacity: 0, x: -10 }}
                            animate={{ opacity: 1, x: 0 }}
                            exit={{ opacity: 0, x: 10 }}
                            className="space-y-1"
                        >
                            {myFriends.length === 0 ? (
                                <div className="text-center py-20 px-6 opacity-30">
                                    <ShieldAlert size={40} className="mx-auto mb-4" />
                                    <p className="text-sm font-medium">No secure links found.</p>
                                </div>
                            ) : (
                                myFriends.map((friend) => (
                                    <div
                                        key={friend._id}
                                        onClick={() => onSelectChat(friend)}
                                        className={`flex items-center gap-3 p-3 rounded-[1.25rem] cursor-pointer transition-all duration-300 ${selectedChat?._id === friend._id ? 'bg-indigo-600/10 border border-indigo-500/20' : 'hover:bg-white/5 border border-transparent'}`}
                                    >
                                        <div className="relative">
                                            <div className="w-12 h-12 rounded-[1rem] bg-indigo-600/20 border border-indigo-500/10 flex items-center justify-center font-bold text-indigo-400">
                                                {getInitials(friend.username)}
                                            </div>
                                            {isUserOnline(friend._id) && (
                                                <div className="absolute bottom-0 right-0 w-3.5 h-3.5 bg-emerald-500 border-2 border-slate-950 rounded-full" />
                                            )}
                                        </div>
                                        <div className="flex-1 min-w-0">
                                            <div className="flex justify-between items-baseline mb-0.5">
                                                <h3 className="font-bold text-white text-sm truncate">{friend.username}</h3>
                                                <span className="text-[9px] text-slate-500">
                                                    {isUserOnline(friend._id) ? 'ACTIVE' : 'OFFLINE'}
                                                </span>
                                            </div>
                                            <p className="text-xs text-slate-500 truncate">Tap to decypher...</p>
                                        </div>
                                    </div>
                                ))
                            )}
                        </motion.div>
                    )}

                    {tab === 'requests' && (
                        <motion.div
                            key="requests-list"
                            initial={{ opacity: 0, x: -10 }}
                            animate={{ opacity: 1, x: 0 }}
                            exit={{ opacity: 0, x: 10 }}
                            className="space-y-3 p-3"
                        >
                            {friendRequests.map((req) => (
                                <div key={req._id} className="p-4 glass-stealth rounded-[2rem] border border-white/5">
                                    <div className="flex items-center gap-3 mb-4">
                                        <div className="w-10 h-10 rounded-xl bg-indigo-600/20 flex items-center justify-center font-bold text-indigo-400">
                                            {getInitials(req.username)}
                                        </div>
                                        <div className="min-w-0">
                                            <h4 className="font-bold text-white text-sm truncate">{req.username}</h4>
                                            <p className="text-[10px] text-slate-500 uppercase tracking-widest">Incoming Signal</p>
                                        </div>
                                    </div>
                                    <div className="flex gap-2">
                                        <button
                                            onClick={() => respondRequest(req._id, 'accept')}
                                            className="flex-1 py-2 bg-indigo-600 text-white rounded-xl text-xs font-bold hover:bg-indigo-700 transition-colors"
                                        >
                                            Accept Link
                                        </button>
                                        <button
                                            onClick={() => respondRequest(req._id, 'reject')}
                                            className="flex-1 py-2 bg-white/5 text-slate-400 rounded-xl text-xs font-bold hover:text-red-400 transition-colors"
                                        >
                                            Purge
                                        </button>
                                    </div>
                                </div>
                            ))}
                        </motion.div>
                    )}

                    {tab === 'search' && (
                        <motion.div
                            key="search-list"
                            initial={{ opacity: 0 }}
                            animate={{ opacity: 1 }}
                            className="space-y-2 p-3"
                        >
                            {searchResult.map((u) => (
                                <div key={u._id} className="flex items-center justify-between p-3 glass-stealth rounded-[1.5rem] border border-white/5">
                                    <div className="flex items-center gap-3">
                                        <div className="w-10 h-10 rounded-xl bg-white/5 flex items-center justify-center font-bold text-slate-400">
                                            {getInitials(u.username)}
                                        </div>
                                        <div className="min-w-0">
                                            <h4 className="font-bold text-white text-sm">{u.username}</h4>
                                            <p className="text-[10px] text-slate-500">Unlinked operative</p>
                                        </div>
                                    </div>
                                    <button
                                        onClick={() => sendRequest(u._id)}
                                        className="p-2.5 bg-indigo-600/10 text-indigo-400 hover:bg-indigo-600 hover:text-white rounded-xl transition-all duration-300"
                                    >
                                        <UserPlus size={18} />
                                    </button>
                                </div>
                            ))}
                        </motion.div>
                    )}
                </AnimatePresence>
            </div>

            {/* Premium Indicator */}
            <div className="p-6 border-t border-white/5 bg-slate-950/50">
                <div className="flex items-center justify-center gap-4 text-slate-600">
                    <Shield size={14} />
                    <span className="text-[10px] uppercase tracking-widest font-bold">Secure Protocol 2.4.0</span>
                </div>
            </div>
        </div>
    );
};

export default React.memo(Sidebar);

