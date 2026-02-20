import React, { useState } from 'react';
import { FaTimes, FaUser, FaLock, FaKey, FaShieldAlt } from 'react-icons/fa';
import axios from 'axios';
import { toast } from 'react-toastify';
import { useChatState } from '../context/ChatProvider';
import { API_BASE_URL } from '../config';

const ProfileModal = ({ isOpen, onClose }) => {
    const { user, setUser } = useChatState();
    const [name, setName] = useState(user?.name || '');
    const [username, setUsername] = useState(user?.username || '');
    const [vaultPassword, setVaultPassword] = useState(user?.vaultPassword || '');
    const [customCode, setCustomCode] = useState(user?.customCode || '');
    const [password, setPassword] = useState('');
    const [loading, setLoading] = useState(false);

    if (!isOpen) return null;

    const handleUpdate = async (e) => {
        e.preventDefault();
        setLoading(true);
        try {
            const config = {
                headers: {
                    "Content-type": "application/json",
                    Authorization: `Bearer ${user.token}`,
                },
            };
            const { data } = await axios.put(`${API_BASE_URL}/api/users/profile`, {
                name,
                username,
                vaultPassword,
                customCode,
                password: password || undefined
            }, config);

            toast.success("Profile updated successfully!");
            setUser(data);
            localStorage.setItem("userInfo", JSON.stringify(data));
            onClose();
        } catch (error) {
            toast.error(error.response?.data?.message || "Failed to update profile");
        } finally {
            setLoading(false);
        }
    };

    return (
        <div className="fixed inset-0 z-[100] flex items-center justify-center bg-black/60 backdrop-blur-sm p-4">
            <div className="w-full max-w-md bg-white dark:bg-gray-900 rounded-3xl shadow-2xl overflow-hidden animate-scale-in">
                <div className="flex items-center justify-between p-6 border-b border-gray-100 dark:border-gray-800">
                    <h2 className="text-xl font-black text-gray-800 dark:text-white">Profile Settings</h2>
                    <button onClick={onClose} className="text-gray-400 hover:text-gray-600 dark:hover:text-gray-200">
                        <FaTimes size={20} />
                    </button>
                </div>

                <form onSubmit={handleUpdate} className="p-6 space-y-5 overflow-y-auto max-h-[70vh] custom-scrollbar">
                    {/* Full Name */}
                    <div>
                        <label className="block text-xs font-bold text-gray-400 uppercase tracking-widest mb-2">Display Name</label>
                        <div className="relative">
                            <FaUser className="absolute left-4 top-1/2 -translate-y-1/2 text-gray-400" />
                            <input
                                type="text"
                                className="w-full bg-gray-50 dark:bg-gray-800 border-none rounded-2xl py-3 pl-12 pr-4 focus:ring-2 focus:ring-indigo-500 text-gray-800 dark:text-white"
                                value={name}
                                onChange={(e) => setName(e.target.value)}
                                placeholder="Your Name"
                            />
                        </div>
                    </div>

                    {/* Username */}
                    <div>
                        <label className="block text-xs font-bold text-gray-400 uppercase tracking-widest mb-2">Personal ID (Username)</label>
                        <div className="relative">
                            <FaShieldAlt className="absolute left-4 top-1/2 -translate-y-1/2 text-gray-400" />
                            <input
                                type="text"
                                className="w-full bg-gray-50 dark:bg-gray-800 border-none rounded-2xl py-3 pl-12 pr-4 focus:ring-2 focus:ring-indigo-500 text-gray-800 dark:text-white"
                                value={username}
                                onChange={(e) => setUsername(e.target.value.toLowerCase().trim())}
                                placeholder="Unique ID"
                            />
                        </div>
                    </div>

                    {/* Vault Password */}
                    <div>
                        <label className="block text-xs font-bold text-gray-400 uppercase tracking-widest mb-2">Vault Passcode (4-digit)</label>
                        <div className="relative">
                            <FaLock className="absolute left-4 top-1/2 -translate-y-1/2 text-gray-400" />
                            <input
                                type="text"
                                maxLength={4}
                                pattern="\d*"
                                className="w-full bg-gray-50 dark:bg-gray-800 border-none rounded-2xl py-3 pl-12 pr-4 focus:ring-2 focus:ring-indigo-500 text-gray-800 dark:text-white"
                                value={vaultPassword}
                                onChange={(e) => setVaultPassword(e.target.value.replace(/\D/g, ''))}
                                placeholder="e.g. 1809"
                            />
                        </div>
                    </div>

                    {/* Custom Code */}
                    <div>
                        <label className="block text-xs font-bold text-gray-400 uppercase tracking-widest mb-2">Vault Trigger (#mypic=...)</label>
                        <div className="relative">
                            <FaKey className="absolute left-4 top-1/2 -translate-y-1/2 text-gray-400" />
                            <input
                                type="text"
                                className="w-full bg-gray-50 dark:bg-gray-800 border-none rounded-2xl py-3 pl-12 pr-4 focus:ring-2 focus:ring-indigo-500 text-gray-800 dark:text-white"
                                value={customCode}
                                onChange={(e) => setCustomCode(e.target.value)}
                                placeholder="e.g. 0404"
                            />
                        </div>
                    </div>

                    {/* Change Password */}
                    <div>
                        <label className="block text-xs font-bold text-gray-400 uppercase tracking-widest mb-2">New Password (optional)</label>
                        <input
                            type="password"
                            className="w-full bg-gray-50 dark:bg-gray-800 border-none rounded-2xl py-3 px-4 focus:ring-2 focus:ring-indigo-500 text-gray-800 dark:text-white"
                            value={password}
                            onChange={(e) => setPassword(e.target.value)}
                            placeholder="Leave blank to keep current"
                        />
                    </div>

                    <button
                        type="submit"
                        disabled={loading}
                        className="w-full py-4 bg-indigo-600 hover:bg-indigo-700 text-white rounded-2xl font-bold transition-all shadow-lg shadow-indigo-600/20 active:scale-95 disabled:opacity-50"
                    >
                        {loading ? "Updating..." : "Save Changes"}
                    </button>
                </form>
            </div>
        </div>
    );
};

export default ProfileModal;
