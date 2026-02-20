import React, { useState, useEffect, useRef } from 'react';
import { FaTrash, FaPlus, FaLock, FaTimes, FaCloudUploadAlt, FaPlayCircle, FaPaperPlane } from 'react-icons/fa';
import axios from 'axios';
import { toast } from 'react-toastify';
import { useChatState } from '../context/ChatProvider';
import { API_BASE_URL } from '../config';

const Vault = ({ isOpen, onClose, onSendToChat, recipientId }) => {
    const { user } = useChatState();
    const [isAuthenticated, setIsAuthenticated] = useState(false);
    const [passcode, setPasscode] = useState('');
    const [loading, setLoading] = useState(false);
    const [media, setMedia] = useState([]);
    const [uploading, setUploading] = useState(false);
    const [selectedItem, setSelectedItem] = useState(null); // For full screen preview
    const [activeIndex, setActiveIndex] = useState(0);
    const fileInputRef = useRef(null);
    const scrollRef = useRef(null);

    // Use dynamic vault password from user profile
    const VAULT_PASSCODE = user?.vaultPassword || '1809';

    useEffect(() => {
        if (isOpen && isAuthenticated && recipientId) {
            fetchMedia();
        }
    }, [isOpen, isAuthenticated, recipientId]);

    const fetchMedia = async () => {
        if (!recipientId) return;
        try {
            setLoading(true);
            const config = { headers: { Authorization: `Bearer ${user.token}` } };
            const { data } = await axios.get(`${API_BASE_URL}/api/vault?recipientId=${recipientId}`, config);
            setMedia(data);
        } catch (error) {
            const msg = error.response?.data?.message || "Failed to load vault content";
            toast.error(msg);
        } finally {
            setLoading(false);
        }
    };

    const handlePasscode = (val) => {
        const newPass = passcode + val;
        if (newPass.length <= VAULT_PASSCODE.length) {
            setPasscode(newPass);
            if (newPass === VAULT_PASSCODE) {
                setTimeout(() => {
                    setIsAuthenticated(true);
                    setPasscode('');
                }, 300);
            } else if (newPass.length === VAULT_PASSCODE.length) {
                setTimeout(() => {
                    setPasscode('');
                    toast.error("Wrong passcode");
                }, 300);
            }
        }
    };

    const handleUpload = async (e) => {
        const file = e.target.files[0];
        if (!file) return;
        if (!recipientId) {
            toast.error("Please open a chat before uploading.");
            return;
        }

        const formData = new FormData();
        formData.append('file', file);
        formData.append('recipientId', recipientId);

        try {
            setUploading(true);
            const config = {
                headers: {
                    "Content-Type": "multipart/form-data",
                    Authorization: `Bearer ${user.token}`
                },
                params: { recipientId }
            };
            await axios.post(`${API_BASE_URL}/api/vault/upload`, formData, config);
            toast.success("Uploaded successfully!");
            fetchMedia();
        } catch (error) {
            const msg = error.response?.data?.message || "Upload failed";
            toast.error(msg);
        } finally {
            setUploading(false);
        }
    };

    const handleDelete = async (publicId, type, e) => {
        e?.stopPropagation();
        if (!window.confirm("Are you sure you want to delete this?")) return;
        try {
            const config = { headers: { Authorization: `Bearer ${user.token}` } };
            await axios.post(`${API_BASE_URL}/api/vault/delete`, { publicId, type }, config);
            toast.success("Item deleted");
            setMedia(media.filter(m => m.public_id !== publicId));
            if (selectedItem?.public_id === publicId) setSelectedItem(null);
        } catch (error) {
            toast.error("Delete failed");
        }
    };

    const handleSend = (item) => {
        if (onSendToChat) {
            onSendToChat(item.secure_url, item.type);
            onClose();
        } else {
            toast.info("Open a chat first to send media");
        }
    };

    // Scroll to item when opened
    useEffect(() => {
        if (selectedItem && scrollRef.current) {
            const index = media.findIndex(m => m.public_id === selectedItem.public_id);
            setActiveIndex(index);
            setTimeout(() => {
                if (scrollRef.current) {
                    scrollRef.current.scrollTo({
                        left: index * scrollRef.current.clientWidth,
                        behavior: 'auto'
                    });
                }
            }, 50);
        }
    }, [selectedItem]);

    const handleScroll = (e) => {
        const index = Math.round(e.target.scrollLeft / e.target.clientWidth);
        if (index !== activeIndex && index >= 0 && index < media.length) {
            setActiveIndex(index);
        }
    };

    if (!isOpen) return null;

    return (
        <div className="fixed inset-0 z-[100] flex items-center justify-center bg-black/95 backdrop-blur-xl animate-fade-in">
            {/* Close Vault Btn */}
            <button
                onClick={onClose}
                className="absolute top-6 right-6 text-white/50 hover:text-white transition-colors z-[110]"
            >
                <FaTimes size={24} />
            </button>

            {!isAuthenticated ? (
                <div className="flex flex-col items-center max-w-xs w-full">
                    <div className="w-16 h-16 bg-white/10 rounded-2xl flex items-center justify-center mb-8 shadow-2xl ring-1 ring-white/20">
                        <FaLock className="text-white text-2xl" />
                    </div>
                    <h2 className="text-xl font-bold text-white mb-2">Private Vault</h2>
                    <p className="text-white/40 text-sm mb-8">Enter {VAULT_PASSCODE.length}-digit passcode</p>

                    <div className="flex space-x-4 mb-12">
                        {Array.from({ length: VAULT_PASSCODE.length }).map((_, i) => (
                            <div key={i} className={`w-3.5 h-3.5 rounded-full border-2 border-white/30 transition-all duration-300 ${passcode.length > i ? 'bg-white border-white scale-125 shadow-[0_0_10px_rgba(255,255,255,0.5)]' : ''}`} />
                        ))}
                    </div>

                    <div className="grid grid-cols-3 gap-6">
                        {[1, 2, 3, 4, 5, 6, 7, 8, 9].map(num => (
                            <button key={num} onClick={() => handlePasscode(num.toString())} className="w-16 h-16 rounded-full bg-white/5 hover:bg-white/10 active:bg-white/20 text-white text-2xl font-medium transition-all">
                                {num}
                            </button>
                        ))}
                        <div />
                        <button onClick={() => handlePasscode('0')} className="w-16 h-16 rounded-full bg-white/5 hover:bg-white/10 active:bg-white/20 text-white text-2xl font-medium transition-all">
                            0
                        </button>
                        <button onClick={() => setPasscode('')} className="text-white/30 hover:text-white/60 text-xs font-bold uppercase tracking-widest pt-5">
                            Clear
                        </button>
                    </div>
                </div>
            ) : (
                <div className="w-full h-full flex flex-col p-6 max-w-5xl">
                    <div className="flex items-center justify-between mb-8 mt-4">
                        <div>
                            <h2 className="text-2xl font-black text-white tracking-tight">Vault Gallery</h2>
                            <p className="text-white/40 text-[10px] font-bold uppercase tracking-widest mt-1">
                                {media.length} Secure Items
                            </p>
                        </div>
                        <div className="flex space-x-3">
                            <button
                                onClick={() => fileInputRef.current.click()}
                                disabled={uploading}
                                className="flex items-center space-x-2 px-5 py-2.5 bg-indigo-600 hover:bg-indigo-500 text-white rounded-xl text-sm font-bold transition-all shadow-lg active:scale-95 disabled:opacity-50"
                            >
                                {uploading ? <div className="animate-spin h-4 w-4 border-2 border-white/30 border-t-white rounded-full" /> : <FaPlus />}
                                <span className="hidden sm:inline">{uploading ? 'Uploading...' : 'Add Media'}</span>
                            </button>
                            <input
                                type="file"
                                ref={fileInputRef}
                                className="hidden"
                                onChange={handleUpload}
                                accept="image/*,video/*"
                            />
                        </div>
                    </div>

                    <div className="flex-1 overflow-y-auto pr-2 custom-scrollbar">
                        {loading ? (
                            <div className="flex flex-col items-center justify-center h-64 space-y-4">
                                <div className="animate-spin h-10 w-10 border-4 border-indigo-500/30 border-t-indigo-500 rounded-full" />
                                <p className="text-white/30 text-xs font-bold uppercase tracking-widest">Accessing Encrypted Storage...</p>
                            </div>
                        ) : media.length === 0 ? (
                            <div className="flex flex-col items-center justify-center h-64 text-center">
                                <div className="w-20 h-20 bg-white/5 rounded-full flex items-center justify-center mb-6">
                                    <FaCloudUploadAlt className="text-white/20 text-3xl" />
                                </div>
                                <p className="text-white/40 text-sm font-medium">This chat's vault is currently empty.</p>
                                <button onClick={() => fileInputRef.current.click()} className="text-indigo-400 text-xs font-bold uppercase mt-4 hover:underline tracking-widest">Securely Upload Now</button>
                            </div>
                        ) : (
                            <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-5 gap-3">
                                {media.map((item) => (
                                    <div
                                        key={item.public_id}
                                        onClick={() => setSelectedItem(item)}
                                        className="group relative aspect-square rounded-2xl overflow-hidden bg-white/5 border border-white/10 shadow-xl cursor-pointer"
                                    >
                                        {item.type === 'video' ? (
                                            <div className="w-full h-full flex items-center justify-center relative">
                                                <video
                                                    src={item.secure_url}
                                                    className="w-full h-full object-cover opacity-60 group-hover:opacity-100 transition-opacity"
                                                />
                                                <div className="absolute inset-0 bg-black/20 group-hover:bg-transparent transition-colors" />
                                                <FaPlayCircle className="absolute inset-0 m-auto text-white/80 text-4xl drop-shadow-lg group-hover:scale-125 transition-transform" />
                                            </div>
                                        ) : (
                                            <img
                                                src={item.secure_url}
                                                alt="vault content"
                                                className="w-full h-full object-cover group-hover:scale-110 transition-transform duration-700 ease-out"
                                                loading="lazy"
                                            />
                                        )}

                                        <div className="absolute bottom-0 left-0 right-0 p-3 bg-gradient-to-t from-black/80 to-transparent opacity-0 group-hover:opacity-100 transition-opacity flex justify-between items-center">
                                            <div className="flex space-x-2">
                                                <button
                                                    onClick={(e) => { e.stopPropagation(); handleSend(item); }}
                                                    className="w-8 h-8 bg-green-500/80 hover:bg-green-500 text-white rounded-lg flex items-center justify-center transition-colors"
                                                    title="Send to Chat"
                                                >
                                                    <FaPaperPlane size={12} />
                                                </button>
                                                <button
                                                    onClick={(e) => handleDelete(item.public_id, item.type, e)}
                                                    className="w-8 h-8 bg-red-500/80 hover:bg-red-50 text-white rounded-lg flex items-center justify-center transition-colors"
                                                    title="Delete"
                                                >
                                                    <FaTrash size={12} />
                                                </button>
                                            </div>
                                        </div>
                                    </div>
                                ))}
                            </div>
                        )}
                    </div>
                </div>
            )}

            {/* FULL SCREEN PREVIEW MODAL */}
            {selectedItem && (
                <div className="fixed inset-0 z-[200] flex flex-col bg-black/98 animate-fade-in touch-none">
                    <div className="flex items-center justify-between p-4 bg-black/50 backdrop-blur-md z-10">
                        <button onClick={() => setSelectedItem(null)} className="text-white/60 hover:text-white p-2">
                            <FaTimes size={20} />
                        </button>
                        <div className="flex space-x-5">
                            <button
                                onClick={() => handleSend(media[activeIndex])}
                                className="flex items-center space-x-2 px-4 py-2 bg-indigo-600 rounded-xl text-white font-bold text-sm shadow-lg shadow-indigo-600/20 active:scale-95 transition-transform"
                            >
                                <FaPaperPlane size={14} />
                                <span className="hidden sm:inline">Send to Chat</span>
                            </button>
                            <button
                                onClick={(e) => handleDelete(media[activeIndex].public_id, media[activeIndex].type, e)}
                                className="flex items-center justify-center w-10 h-10 bg-white/5 hover:bg-red-500/20 text-red-400 hover:text-red-500 rounded-xl transition-all"
                            >
                                <FaTrash size={18} />
                            </button>
                        </div>
                    </div>

                    <div
                        ref={scrollRef}
                        onScroll={handleScroll}
                        className="flex-1 flex overflow-x-auto snap-x snap-mandatory hide-scrollbar"
                    >
                        {media.map((item) => (
                            <div
                                key={item.public_id}
                                className="w-full h-full flex-shrink-0 flex items-center justify-center p-4 snap-center"
                            >
                                {item.type === 'video' ? (
                                    <video
                                        src={item.secure_url}
                                        controls
                                        controlsList="nodownload"
                                        onContextMenu={(e) => e.preventDefault()}
                                        className="max-w-full max-h-full rounded-2xl shadow-2xl"
                                    />
                                ) : (
                                    <div className="relative group max-w-full max-h-full flex items-center justify-center">
                                        <img
                                            src={item.secure_url}
                                            alt="preview"
                                            className="max-w-full max-h-full object-contain rounded-2xl shadow-2xl shadow-indigo-500/10 pointer-events-none"
                                        />
                                    </div>
                                )}
                            </div>
                        ))}
                    </div>

                    {/* INDEX INDICATOR */}
                    <div className="absolute bottom-6 left-1/2 -translate-x-1/2 px-4 py-2 bg-black/40 backdrop-blur-md rounded-full border border-white/10">
                        <span className="text-white/90 text-[10px] font-black uppercase tracking-[0.2em]">
                            {activeIndex + 1} <span className="text-white/30 mx-1">/</span> {media.length}
                        </span>
                    </div>
                </div>
            )}
        </div>
    );
};

export default Vault;
