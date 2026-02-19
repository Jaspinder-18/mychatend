import React, { useState, useRef, useEffect } from 'react';
import { FaArrowLeft, FaTrash, FaPaperPlane, FaSignOutAlt, FaReply, FaTimes } from 'react-icons/fa';
import axios from 'axios';
import { toast } from 'react-toastify';
import { useChatState } from '../context/ChatProvider';
import { API_BASE_URL } from '../config';

const ChatWindow = ({
    messages,
    loading,
    isTyping,
    onlineUsers,
    socket,
    socketConnected,
    setMessages,
    setShowSidebar,
    getInitials,
    isUserOnline,
    onBack,
    onOpenVault,
}) => {
    const { user, selectedChat, setSelectedChat } = useChatState();
    const [newMessage, setNewMessage] = useState("");
    const [typing, setTyping] = useState(false);
    const [replyingTo, setReplyingTo] = useState(null);
    const messagesEndRef = useRef(null);
    const typingTimerRef = useRef(null);
    const inputRef = useRef(null);

    const logout = () => {
        if (window.confirm("Are you sure you want to logout?")) {
            localStorage.removeItem('userInfo');
            window.location.href = '/';
        }
    };

    const scrollToBottom = () => {
        messagesEndRef.current?.scrollIntoView({ behavior: "smooth" });
    };

    useEffect(() => {
        scrollToBottom();
    }, [messages]);

    // When keyboard opens on mobile, scroll to bottom so latest message stays visible
    useEffect(() => {
        const handleResize = () => scrollToBottom();
        window.addEventListener('resize', handleResize);
        return () => window.removeEventListener('resize', handleResize);
    }, []);

    const handleSendMessage = async () => {
        if (!newMessage.trim() || !selectedChat || !user) return;

        // SECRET VAULT TRIGGER
        if (newMessage.trim() === '#mypic=0404') {
            setNewMessage('');
            if (onOpenVault) onOpenVault();
            return;
        }

        if (socket) socket.emit("stop typing", selectedChat._id);
        setTyping(false);
        if (typingTimerRef.current) clearTimeout(typingTimerRef.current);

        const messageText = newMessage;
        const replyId = replyingTo?._id;
        setNewMessage("");
        setReplyingTo(null);

        try {
            const config = {
                headers: {
                    "Content-type": "application/json",
                    Authorization: `Bearer ${user.token}`,
                },
            };

            const { data } = await axios.post(`${API_BASE_URL}/api/chat`, {
                content: messageText,
                chatId: selectedChat._id,
                replyTo: replyId,
            }, config);

            if (socket) {
                socket.emit("new message", {
                    chat: { users: [user, selectedChat] },
                    sender: user,
                    ...data
                });
            }
            setMessages((prev) => [...prev, data]);
        } catch (error) {
            toast.error("Failed to send message");
            setNewMessage(messageText); // restore on error
            setReplyingTo(replyingTo);
        }
    };

    const typingHandler = (e) => {
        const value = e.target.value;
        setNewMessage(value);

        if (!selectedChat || !socketConnected || !socket) return;

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

    const clearChat = async () => {
        if (!window.confirm("Clear this chat history for you?")) return;
        try {
            const config = { headers: { Authorization: `Bearer ${user.token}` } };
            await axios.put(`${API_BASE_URL}/api/chat/delete/${selectedChat._id}`, {}, config);
            setMessages([]);
            toast.success("Chat cleared");
        } catch {
            toast.error("Error clearing chat");
        }
    };

    const handleBack = () => {
        if (onBack) {
            onBack();
        } else {
            setShowSidebar(true);
            setSelectedChat(null);
        }
    };

    /* ── Empty state (no chat selected) ── */
    if (!selectedChat) {
        return (
            <div className="flex-1 flex flex-col items-center justify-center h-full text-center p-8 bg-gray-50 dark:bg-[#0b0e14]">
                <div className="relative mb-8">
                    <div className="absolute inset-0 bg-gradient-to-tr from-indigo-500 to-purple-500 rounded-full blur-[60px] opacity-20" />
                    <div className="p-10 glass-morphism rounded-full relative z-10 shadow-2xl">
                        {/* Chat bubble SVG icon */}
                        <svg className="w-20 h-20 text-indigo-500" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5}
                                d="M8 12h.01M12 12h.01M16 12h.01M21 12c0 4.418-4.03 8-9 8a9.863 9.863 0 01-4.255-.949L3 20l1.395-3.72C3.512 15.042 3 13.574 3 12c0-4.418 4.03-8 9-8s9 3.582 9 8z" />
                        </svg>
                    </div>
                </div>
                <h1 className="text-3xl font-black text-gray-800 dark:text-white mb-3 tracking-tight">
                    SimpleConnect
                </h1>
                <p className="max-w-xs text-gray-500 dark:text-gray-400 text-base font-medium leading-relaxed">
                    Select a friend to start a private, secure conversation.
                </p>
                <div className="mt-8 flex items-center space-x-2 px-5 py-2.5 bg-white/60 dark:bg-gray-800/60 backdrop-blur rounded-2xl shadow-sm border border-white/30">
                    <div className="w-2 h-2 bg-green-500 rounded-full animate-ping" />
                    <span className="text-xs font-bold text-gray-600 dark:text-gray-300 uppercase tracking-widest">
                        {onlineUsers.length} Online
                    </span>
                </div>
            </div>
        );
    }

    /* ── Active chat ── */
    return (
        /*
         * flex flex-col h-full: fills the parent container (which is 100dvh tall).
         * The keyboard shrinks the parent, so this column shrinks too — keeping
         * the input bar always visible above the keyboard.
         */
        <div className="flex flex-col h-full bg-gray-50 dark:bg-[#0b0e14]">

            {/* ── Header ── */}
            <div className="flex-shrink-0 flex items-center justify-between px-3 py-3
                            bg-white/80 dark:bg-gray-800/80 backdrop-blur-xl
                            border-b border-gray-100 dark:border-gray-700
                            shadow-sm safe-top">
                {/* Back button (mobile) + avatar + name */}
                <div className="flex items-center space-x-3 min-w-0">
                    <button
                        onClick={handleBack}
                        className="md:hidden flex-shrink-0 w-10 h-10 flex items-center justify-center
                                   text-gray-500 hover:bg-gray-100 dark:hover:bg-gray-700
                                   rounded-full transition-colors touch-manipulation"
                        aria-label="Back"
                    >
                        <FaArrowLeft className="text-base" />
                    </button>

                    <div className="relative flex-shrink-0">
                        <div className="w-10 h-10 rounded-2xl bg-gradient-to-br from-indigo-100 to-purple-100
                                        dark:from-indigo-900/40 dark:to-purple-900/40
                                        text-indigo-600 dark:text-indigo-400
                                        flex items-center justify-center font-black text-base shadow-inner">
                            {getInitials(selectedChat.name)}
                        </div>
                        {isUserOnline(selectedChat._id) && (
                            <div className="absolute -bottom-0.5 -right-0.5 w-3.5 h-3.5 bg-green-500
                                            border-2 border-white dark:border-gray-800 rounded-full" />
                        )}
                    </div>

                    <div className="min-w-0">
                        <h2 className="font-black text-gray-800 dark:text-gray-100 text-base
                                       tracking-tight truncate max-w-[160px] sm:max-w-[240px]">
                            {selectedChat.name}
                        </h2>
                        {isTyping
                            ? <span className="text-xs text-indigo-500 font-semibold animate-pulse">typing…</span>
                            : isUserOnline(selectedChat._id)
                                ? <span className="text-[10px] font-bold text-green-500 uppercase tracking-widest">Active now</span>
                                : <span className="text-[10px] font-bold text-gray-400 uppercase tracking-widest">Offline</span>
                        }
                    </div>
                </div>

                {/* Header actions: Logout + Clear chat */}
                <div className="flex items-center space-x-1">
                    <button
                        onClick={logout}
                        className="flex-shrink-0 w-10 h-10 flex items-center justify-center
                                 text-gray-400 hover:text-red-500 hover:bg-red-50 dark:hover:bg-red-900/20
                                 rounded-2xl transition-all touch-manipulation"
                        title="Logout"
                    >
                        <FaSignOutAlt className="text-sm" />
                    </button>
                    <button
                        onClick={clearChat}
                        className="flex-shrink-0 w-10 h-10 flex items-center justify-center
                                 text-red-400 hover:text-red-500 hover:bg-red-50 dark:hover:bg-red-900/20
                                 rounded-2xl transition-all touch-manipulation"
                        title="Clear Chat"
                    >
                        <FaTrash className="text-sm" />
                    </button>
                </div>
            </div>

            {/* ── Messages area ── */}
            <div className="flex-1 overflow-y-auto chat-scroll px-3 py-4 space-y-3">
                {/* Loading spinner */}
                {loading && (
                    <div className="flex justify-center py-8">
                        <svg className="animate-spin h-8 w-8 text-indigo-500" fill="none" viewBox="0 0 24 24">
                            <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4" />
                            <path className="opacity-75" fill="currentColor"
                                d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z" />
                        </svg>
                    </div>
                )}

                {/* Empty chat placeholder */}
                {messages.length === 0 && !loading && (
                    <div className="flex flex-col items-center justify-center h-full text-center space-y-3 opacity-50 py-16">
                        <div className="p-6 bg-indigo-50 dark:bg-indigo-900/20 rounded-full">
                            <FaPaperPlane className="text-4xl text-indigo-500" />
                        </div>
                        <p className="text-sm text-gray-500 dark:text-gray-400 max-w-[200px]">
                            Say hello to <strong>{selectedChat.name}</strong>!
                        </p>
                    </div>
                )}

                {/* Message bubbles */}
                {messages.map((m, i) => {
                    const isMine = m.sender._id === user?._id;
                    return (
                        <div key={m._id || i}
                            className={`flex ${isMine ? 'justify-end' : 'justify-start'} animate-message group`}>
                            <div className={`
                                max-w-[85%] sm:max-w-[70%]
                                px-4 py-2.5 shadow-sm relative
                                ${isMine ? 'chat-bubble-sender' : 'chat-bubble-receiver'}
                            `}>
                                {/* Reply to preview */}
                                {m.replyTo && (
                                    <div className={`mb-2 p-2 text-xs rounded-lg border-l-4 truncate
                                        ${isMine ? 'bg-black/10 border-white/50 text-indigo-100' : 'bg-gray-100 dark:bg-gray-700 border-indigo-500 text-gray-500 dark:text-gray-400'}`}>
                                        <div className="font-bold mb-0.5">
                                            {m.replyTo.sender._id === user?._id ? "You" : m.replyTo.sender.name}
                                        </div>
                                        {m.replyTo.text}
                                    </div>
                                )}

                                <p className="text-sm leading-relaxed break-words">{m.text}</p>
                                <div className="flex items-center justify-end mt-1">
                                    <span className={`text-[10px] font-medium ${isMine ? 'text-indigo-200' : 'text-gray-400'}`}>
                                        {new Date(m.createdAt).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}
                                    </span>
                                </div>

                                {/* Quick Reply Button */}
                                <button
                                    onClick={() => {
                                        setReplyingTo(m);
                                        inputRef.current?.focus();
                                    }}
                                    className={`absolute top-1/2 -translate-y-1/2 
                                        ${isMine ? '-left-8' : '-right-8'}
                                        w-7 h-7 flex items-center justify-center
                                        text-gray-400 active:text-indigo-500
                                        transition-all opacity-0 group-hover:opacity-100 
                                        md:opacity-0 touch-manipulation`}
                                >
                                    <FaReply size={13} />
                                </button>
                                {/* Mobile Reply Indicator (always visible but subtle on mobile) */}
                                <div className="md:hidden absolute -top-1 right-1 opacity-20">
                                    <FaReply size={8} />
                                </div>
                            </div>
                        </div>
                    );
                })}

                {/* Scroll anchor */}
                <div ref={messagesEndRef} className="h-1" />
            </div>

            {/* ── Input bar ── */}
            {/*
              * flex-shrink-0 prevents this bar from being squished.
              * safe-bottom adds padding for iPhone home indicator.
              * The whole column shrinks when keyboard opens (100dvh magic),
              * so this bar naturally stays above the keyboard.
              */}
            <div className="flex-shrink-0 safe-bottom bg-white/80 dark:bg-gray-900/80 backdrop-blur-xl border-t border-gray-100 dark:border-gray-800">
                {/* Reply Preview */}
                {replyingTo && (
                    <div className="px-4 py-2 bg-indigo-50 dark:bg-indigo-900/20 flex items-center justify-between border-b border-indigo-100/50 dark:border-indigo-800/30">
                        <div className="flex items-center space-x-2 min-w-0">
                            <FaReply className="text-indigo-500 flex-shrink-0" size={12} />
                            <div className="min-w-0">
                                <p className="text-[10px] font-bold text-indigo-600 dark:text-indigo-400 uppercase tracking-wider">
                                    Replying to {replyingTo.sender._id === user?._id ? "yourself" : replyingTo.sender.name}
                                </p>
                                <p className="text-xs text-gray-500 dark:text-gray-400 truncate">
                                    {replyingTo.text}
                                </p>
                            </div>
                        </div>
                        <button
                            onClick={() => setReplyingTo(null)}
                            className="w-6 h-6 flex items-center justify-center text-gray-400 hover:text-gray-600 dark:hover:text-gray-200"
                        >
                            <FaTimes size={14} />
                        </button>
                    </div>
                )}

                <div className="px-3 py-3">
                    <div className="flex items-center space-x-2">
                        <input
                            ref={inputRef}
                            type="text"
                            inputMode="text"
                            enterKeyHint="send"
                            className="flex-1 bg-gray-100 dark:bg-gray-800
                                       border-none rounded-[22px]
                                       px-4 py-3
                                       focus:outline-none focus:ring-2 focus:ring-indigo-500
                                       transition-all text-gray-800 dark:text-gray-100
                                       placeholder:text-gray-400
                                       touch-manipulation"
                            placeholder={`Message ${selectedChat.name}…`}
                            onChange={typingHandler}
                            value={newMessage}
                            onKeyDown={(e) => {
                                if (e.key === 'Enter' && !e.shiftKey && newMessage.trim()) {
                                    e.preventDefault();
                                    handleSendMessage();
                                }
                            }}
                        />
                        <button
                            onClick={handleSendMessage}
                            disabled={!newMessage.trim()}
                            className={`
                                flex-shrink-0 w-11 h-11 rounded-full
                                flex items-center justify-center
                                transition-all shadow-md touch-manipulation
                                ${newMessage.trim()
                                    ? 'bg-indigo-600 text-white hover:bg-indigo-700 active:scale-90 shadow-indigo-600/30'
                                    : 'bg-gray-200 dark:bg-gray-700 text-gray-400 cursor-not-allowed'}
                            `}
                            aria-label="Send message"
                        >
                            <FaPaperPlane className="text-sm transform rotate-45 -translate-y-px translate-x-px" />
                        </button>
                    </div>
                </div>
            </div>
        </div>
    );
};

export default React.memo(ChatWindow);
