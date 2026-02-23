import React, { useState, useRef, useEffect } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import {
    ChevronLeft, Send, Trash2, Shield, Zap, Clock,
    MoreVertical, Info, Reply, X, Image as ImageIcon
} from 'lucide-react';
import axios from 'axios';
import { toast } from 'react-toastify';
import { useChatState } from '../context/ChatProvider';
import { API_BASE_URL } from '../config';
import { encryptMessage, decryptMessage } from '../services/encryptionService';

const ChatWindow = ({
    messages,
    loading,
    isTyping,
    onlineUsers,
    socket,
    socketConnected,
    setMessages,
    getInitials,
    isUserOnline,
    onBack,
    onOpenVault,
}) => {
    const { user, selectedChat } = useChatState();
    const [newMessage, setNewMessage] = useState("");
    const [typing, setTyping] = useState(false);
    const [decryptedMessages, setDecryptedMessages] = useState({});
    const messagesEndRef = useRef(null);
    const typingTimerRef = useRef(null);

    const scrollToBottom = () => {
        messagesEndRef.current?.scrollIntoView({ behavior: "smooth" });
    };

    useEffect(() => {
        scrollToBottom();
    }, [messages, decryptedMessages]);

    // Decrypt messages as they come in
    useEffect(() => {
        const decryptAll = async () => {
            const privateKey = localStorage.getItem('privateKey');
            if (!privateKey) return;

            const newDecrypted = { ...decryptedMessages };
            let changed = false;

            for (const m of messages) {
                if (!newDecrypted[m._id] && m.encrypted_message) {
                    try {
                        const plainText = await decryptMessage(m.encrypted_message, privateKey);
                        newDecrypted[m._id] = plainText;
                        changed = true;
                    } catch (err) {
                        newDecrypted[m._id] = "[Encryption Error: Failed to decrypt]";
                        changed = true;
                    }
                }
            }

            if (changed) setDecryptedMessages(newDecrypted);
        };
        decryptAll();
    }, [messages]);

    const handleSendMessage = async () => {
        const text = newMessage.trim();
        if (!text || !selectedChat || !user) return;

        // Check for vault trigger (legacy compatibility, but we can make it cleaner)
        if (text.toLowerCase() === '#vault') {
            setNewMessage('');
            onOpenVault();
            return;
        }

        const currentMsg = text;
        setNewMessage("");

        try {
            // Check for recipient public key
            const recipientPublicKey = selectedChat.public_key;
            if (!recipientPublicKey) {
                toast.error("Recipient has no public key. Security compromised.");
                return;
            }

            // Encrypt Message
            const encryptedPayload = await encryptMessage(currentMsg, recipientPublicKey);

            const config = {
                headers: {
                    "Content-type": "application/json",
                    Authorization: `Bearer ${user.token}`,
                },
            };

            const { data } = await axios.post(`${API_BASE_URL}/api/chat`, {
                encrypted_message: encryptedPayload,
                chatId: selectedChat._id,
                duration: 0, // 0 means no self-destruct for now
            }, config);

            if (socket) {
                socket.emit("new message", data);
            }
            setMessages((prev) => [...prev, data]);
        } catch (error) {
            console.error("Detailed Transmission Error:", error);
            const errorResponseMsg = error.response?.data?.message;
            const errorMsg = errorResponseMsg || error.message || "Failed to transmit secure packet.";

            // Helpful tip for common local testing issue
            if (errorMsg.includes("SubtleCrypto") || errorMsg.includes("crypto.subtle")) {
                toast.error("Security Error: RSA Encryption requires a Secure Context (HTTPS or localhost). Are you using an IP address?");
            } else {
                toast.error(`Transmission Error: ${errorMsg}`);
            }

            setNewMessage(currentMsg);
        }
    };

    const typingHandler = (e) => {
        setNewMessage(e.target.value);
        if (!socketConnected || !socket) return;

        if (!typing) {
            setTyping(true);
            socket.emit("typing", selectedChat._id);
        }

        if (typingTimerRef.current) clearTimeout(typingTimerRef.current);
        typingTimerRef.current = setTimeout(() => {
            socket.emit("stop typing", selectedChat._id);
            setTyping(false);
        }, 3000);
    };

    if (!selectedChat) {
        return (
            <div className="flex-1 flex flex-col items-center justify-center p-8 bg-slate-950/50">
                <motion.div
                    initial={{ opacity: 0, scale: 0.9 }}
                    animate={{ opacity: 1, scale: 1 }}
                    className="text-center"
                >
                    <div className="w-24 h-24 bg-indigo-500/10 rounded-full flex items-center justify-center mx-auto mb-6 border border-indigo-500/20">
                        <Zap className="text-indigo-500" size={40} />
                    </div>
                    <h2 className="text-2xl font-bold mb-2">Secure Channel Waiting</h2>
                    <p className="text-slate-500">Select a contact to initiate E2E encrypted session.</p>
                </motion.div>
            </div>
        );
    }

    return (
        <div className="flex flex-col h-full bg-slate-950 relative">
            {/* Header */}
            <header className="glass-stealth px-4 py-3 safe-area-pt flex items-center justify-between z-50">
                <div className="flex items-center gap-3 min-w-0">
                    <button onClick={onBack} className="p-2 -ml-2 text-slate-400 hover:text-white md:hidden">
                        <ChevronLeft size={24} />
                    </button>
                    <div className="relative">
                        <div className="w-10 h-10 rounded-xl bg-indigo-600/20 border border-indigo-500/30 flex items-center justify-center font-bold text-indigo-400">
                            {getInitials(selectedChat.username)}
                        </div>
                        {isUserOnline(selectedChat._id) && (
                            <div className="absolute -bottom-0.5 -right-0.5 w-3 h-3 bg-emerald-500 border-2 border-slate-950 rounded-full" />
                        )}
                    </div>
                    <div className="min-w-0">
                        <h3 className="font-bold text-white truncate">{selectedChat.username}</h3>
                        <p className="text-[10px] uppercase tracking-widest font-bold text-indigo-500/70">
                            {isTyping ? 'Intercepting keys...' : 'Encrypted Link'}
                        </p>
                    </div>
                </div>
                <div className="flex items-center gap-1">
                    <button onClick={onOpenVault} className="p-2 text-slate-400 hover:text-indigo-400 transition-colors">
                        <Shield size={20} />
                    </button>
                    <button className="p-2 text-slate-400 hover:text-white">
                        <MoreVertical size={20} />
                    </button>
                </div>
            </header>

            {/* Messages Area */}
            <main className="flex-1 overflow-y-auto custom-scrollbar p-4 space-y-4">
                <AnimatePresence initial={false}>
                    {messages.map((m) => {
                        const isMine = m.sender._id === user?._id;
                        return (
                            <motion.div
                                initial={{ opacity: 0, y: 10, scale: 0.95 }}
                                animate={{ opacity: 1, y: 0, scale: 1 }}
                                key={m._id}
                                className={`flex ${isMine ? 'justify-end' : 'justify-start'}`}
                            >
                                <div className={`
                                    max-w-[80%] px-4 py-2.5 
                                    ${isMine ? 'chat-bubble-stealth-sender' : 'chat-bubble-stealth-receiver'}
                                `}>
                                    <p className="text-sm leading-relaxed whitespace-pre-wrap">
                                        {decryptedMessages[m._id] || (loading ? 'Decrypting...' : 'Encrypted Packet')}
                                    </p>
                                    <div className="mt-1 flex items-center justify-end gap-2">
                                        {m.expires_at && (
                                            <div className="flex items-center gap-1 text-[9px] text-indigo-400">
                                                <Clock size={10} />
                                                <span>Temporal</span>
                                            </div>
                                        )}
                                        <span className="text-[9px] opacity-40">
                                            {new Date(m.createdAt).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}
                                        </span>
                                    </div>
                                </div>
                            </motion.div>
                        );
                    })}
                </AnimatePresence>
                <div ref={messagesEndRef} />
            </main>

            {/* Input Bar */}
            <footer className="p-4 safe-area-pb bg-slate-950/80 backdrop-blur-xl border-t border-white/5">
                <div className="flex items-center gap-2">
                    <button className="p-3 bg-white/5 rounded-2xl text-slate-400 hover:text-white transition-all">
                        <ImageIcon size={20} />
                    </button>
                    <div className="flex-1 relative">
                        <input
                            type="text"
                            placeholder="Type an encoded message..."
                            value={newMessage}
                            onChange={typingHandler}
                            onKeyDown={(e) => e.key === 'Enter' && handleSendMessage()}
                            className="w-full bg-white/5 border border-white/10 rounded-2xl px-5 py-3 focus:outline-none focus:border-indigo-500/50 transition-all text-sm"
                        />
                    </div>
                    <button
                        onClick={handleSendMessage}
                        disabled={!newMessage.trim()}
                        className={`p-3 rounded-2xl transition-all ${newMessage.trim() ? 'bg-indigo-600 text-white shadow-lg shadow-indigo-600/20' : 'bg-white/5 text-slate-600'}`}
                    >
                        <Send size={20} />
                    </button>
                </div>
            </footer>
        </div>
    );
};

export default React.memo(ChatWindow);

