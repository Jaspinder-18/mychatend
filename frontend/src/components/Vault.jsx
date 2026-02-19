import React, { useState, useEffect, useRef } from 'react';
import { FaTrash, FaPlus, FaLock, FaTimes, FaCloudUploadAlt, FaPlayCircle, FaImage } from 'react-icons/fa';
import axios from 'axios';
import { toast } from 'react-toastify';
import { useChatState } from '../context/ChatProvider';
import { API_BASE_URL } from '../config';

const Vault = ({ isOpen, onClose }) => {
    const { user } = useChatState();
    const [isAuthenticated, setIsAuthenticated] = useState(false);
    const [passcode, setPasscode] = useState('');
    const [loading, setLoading] = useState(false);
    const [media, setMedia] = useState([]);
    const [uploading, setUploading] = useState(false);
    const fileInputRef = useRef(null);

    const VAULT_PASSCODE = '1809';

    useEffect(() => {
        if (isOpen && isAuthenticated) {
            fetchMedia();
        }
    }, [isOpen, isAuthenticated]);

    const fetchMedia = async () => {
        try {
            setLoading(true);
            const config = { headers: { Authorization: `Bearer ${user.token}` } };
            const { data } = await axios.get(`${API_BASE_URL}/api/vault`, config);
            setMedia(data);
        } catch (error) {
            toast.error("Failed to load vault content");
        } finally {
            setLoading(false);
        }
    };

    const handlePasscode = (val) => {
        const newPass = passcode + val;
        if (newPass.length <= 4) {
            setPasscode(newPass);
            if (newPass === VAULT_PASSCODE) {
                setTimeout(() => {
                    setIsAuthenticated(true);
                    setPasscode('');
                }, 300);
            } else if (newPass.length === 4) {
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

        const formData = new FormData();
        formData.append('file', file);

        try {
            setUploading(true);
            const config = {
                headers: {
                    "Content-Type": "multipart/form-data",
                    Authorization: `Bearer ${user.token}`
                }
            };
            await axios.post(`${API_BASE_URL}/api/vault/upload`, formData, config);
            toast.success("Uploaded successfully!");
            fetchMedia();
        } catch (error) {
            toast.error("Upload failed");
        } finally {
            setUploading(false);
        }
    };

    const handleDelete = async (publicId, type) => {
        if (!window.confirm("Are you sure you want to delete this?")) return;
        try {
            const config = { headers: { Authorization: `Bearer ${user.token}` } };
            await axios.delete(`${API_BASE_URL}/api/vault/${publicId}?type=${type}`, config);
            toast.success("Item deleted");
            setMedia(media.filter(m => m.public_id !== publicId));
        } catch (error) {
            toast.error("Delete failed");
        }
    };

    if (!isOpen) return null;

    return (
        <div className="fixed inset-0 z-[100] flex items-center justify-center bg-black/95 backdrop-blur-xl animate-fade-in">
            <button
                onClick={onClose}
                className="absolute top-6 right-6 text-white/50 hover:text-white transition-colors"
            >
                <FaTimes size={24} />
            </button>

            {!isAuthenticated ? (
                <div className="flex flex-col items-center max-w-xs w-full">
                    <div className="w-16 h-16 bg-white/10 rounded-2xl flex items-center justify-center mb-8 shadow-2xl ring-1 ring-white/20">
                        <FaLock className="text-white text-2xl" />
                    </div>
                    <h2 className="text-xl font-bold text-white mb-2">Private Vault</h2>
                    <p className="text-white/40 text-sm mb-8">Enter 4-digit passcode</p>

                    <div className="flex space-x-4 mb-12">
                        {[0, 1, 2, 3].map(i => (
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
                <div className="w-full h-full flex flex-col p-6 max-w-4xl">
                    <div className="flex items-center justify-between mb-8 mt-4">
                        <div>
                            <h2 className="text-2xl font-black text-white tracking-tight">Vault Gallery</h2>
                            <p className="text-white/40 text-xs font-bold uppercase tracking-widest mt-1">
                                {media.length} Items Found
                            </p>
                        </div>
                        <div className="flex space-x-3">
                            <button
                                onClick={() => fileInputRef.current.click()}
                                disabled={uploading}
                                className="flex items-center space-x-2 px-5 py-2.5 bg-indigo-600 hover:bg-indigo-500 text-white rounded-xl text-sm font-bold transition-all shadow-lg active:scale-95 disabled:opacity-50"
                            >
                                {uploading ? <div className="animate-spin h-4 w-4 border-2 border-white/30 border-t-white rounded-full" /> : <FaPlus />}
                                <span>{uploading ? 'Uploading...' : 'Add Media'}</span>
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
                                <p className="text-white/30 text-xs font-bold uppercase tracking-widest">Loading encrypted data...</p>
                            </div>
                        ) : media.length === 0 ? (
                            <div className="flex flex-col items-center justify-center h-64 text-center">
                                <div className="w-20 h-20 bg-white/5 rounded-full flex items-center justify-center mb-6">
                                    <FaCloudUploadAlt className="text-white/20 text-3xl" />
                                </div>
                                <p className="text-white/40 text-sm">Vault is empty.</p>
                                <button onClick={() => fileInputRef.current.click()} className="text-indigo-400 text-xs font-bold uppercase mt-2 hover:underline">Upload your first memory</button>
                            </div>
                        ) : (
                            <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 gap-4">
                                {media.map((item) => (
                                    <div key={item.public_id} className="group relative aspect-square rounded-2xl overflow-hidden bg-white/5 border border-white/10 shadow-xl">
                                        {item.type === 'video' ? (
                                            <div className="w-full h-full flex items-center justify-center relative">
                                                <video
                                                    src={item.secure_url}
                                                    className="w-full h-full object-cover opacity-60 group-hover:opacity-100 transition-opacity"
                                                />
                                                <FaPlayCircle className="absolute inset-0 m-auto text-white/80 text-3xl group-hover:scale-110 transition-transform" />
                                            </div>
                                        ) : (
                                            <img
                                                src={item.secure_url}
                                                alt="vault content"
                                                className="w-full h-full object-cover group-hover:scale-110 transition-transform duration-500"
                                            />
                                        )}

                                        <div className="absolute inset-0 bg-gradient-to-t from-black/80 via-transparent to-transparent opacity-0 group-hover:opacity-100 transition-opacity flex flex-col justify-end p-3">
                                            <button
                                                onClick={() => handleDelete(item.public_id, item.type)}
                                                className="self-end w-8 h-8 bg-red-500/80 hover:bg-red-500 text-white rounded-lg flex items-center justify-center transition-colors"
                                            >
                                                <FaTrash size={12} />
                                            </button>
                                        </div>
                                    </div>
                                ))}
                            </div>
                        )}
                    </div>
                </div>
            )}
        </div>
    );
};

export default Vault;
