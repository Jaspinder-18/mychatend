import React, { useEffect, useState } from 'react';
import axios from 'axios';
import { useChatState } from '../context/ChatProvider';
import io from 'socket.io-client';
import { toast } from 'react-toastify';
import { motion, AnimatePresence } from 'framer-motion';
import Sidebar from '../components/Sidebar';
import ChatWindow from '../components/ChatWindow';
import Vault from '../components/Vault';
import { API_BASE_URL } from '../config';

const ENDPOINT = API_BASE_URL;
let socket, selectedChatCompare;

const DashboardPage = () => {
    const { user, setSelectedChat, selectedChat, notification, setNotification } = useChatState();
    const [messages, setMessages] = useState([]);
    const [loading, setLoading] = useState(false);
    const [socketConnected, setSocketConnected] = useState(false);
    const [isTyping, setIsTyping] = useState(false);
    const [showSidebar, setShowSidebar] = useState(true);
    const [isVaultOpen, setIsVaultOpen] = useState(false);
    const [friendRequests, setFriendRequests] = useState([]);
    const [myFriends, setMyFriends] = useState([]);
    const [onlineUsers, setOnlineUsers] = useState([]);

    useEffect(() => {
        if (!user) return;
        fetchFriends();
        fetchFriendRequests();
    }, [user]);

    useEffect(() => {
        socket = io(ENDPOINT);
        if (user) {
            socket.emit("setup", user);
        }
        socket.on("connected", () => setSocketConnected(true));
        socket.on("typing", () => setIsTyping(true));
        socket.on("stop typing", () => setIsTyping(false));
        socket.on("online-users", (users) => setOnlineUsers(users));

        return () => {
            socket.disconnect();
        };
    }, [user]);

    useEffect(() => {
        const handleMessageReceived = (newMessageRecieved) => {
            if (!selectedChatCompare || selectedChatCompare._id !== newMessageRecieved.sender._id) {
                setNotification((prev) => {
                    if (!prev.some(n => n._id === newMessageRecieved._id)) {
                        return [newMessageRecieved, ...prev];
                    }
                    return prev;
                });
                fetchFriends();
            } else {
                setMessages((prev) => [...prev, newMessageRecieved]);
            }
        };

        socket?.on("message recieved", handleMessageReceived);
        return () => {
            socket?.off("message recieved", handleMessageReceived);
        };
    });

    const isUserOnline = (userId) => onlineUsers.some(u => u.userId === userId);

    const fetchFriends = async () => {
        if (!user) return;
        try {
            const config = { headers: { Authorization: `Bearer ${user.token}` } };
            const { data } = await axios.get(`${API_BASE_URL}/api/users/friends`, config);
            setMyFriends(data);
        } catch {
            toast.error("Friends scan failed.");
        }
    };

    const fetchFriendRequests = async () => {
        if (!user) return;
        try {
            const config = { headers: { Authorization: `Bearer ${user.token}` } };
            const { data } = await axios.get(`${API_BASE_URL}/api/users/friend-requests`, config);
            setFriendRequests(data);
        } catch {
            toast.error("Signal scan failed.");
        }
    };

    const fetchMessages = async () => {
        if (!selectedChat || !user) return;
        try {
            const config = { headers: { Authorization: `Bearer ${user.token}` } };
            setLoading(true);
            const { data } = await axios.get(`${API_BASE_URL}/api/chat/${selectedChat._id}`, config);
            setMessages(data);
            setLoading(false);
            socket.emit("join chat", user._id);
        } catch {
            toast.error("Transmission failed.");
            setLoading(false);
        }
    };

    useEffect(() => {
        fetchMessages();
        selectedChatCompare = selectedChat;
    }, [selectedChat]);

    const getInitials = (username) => {
        if (!username) return '??';
        return username.slice(0, 2).toUpperCase();
    };

    const handleSelectChat = (friend) => {
        setSelectedChat(friend);
        setShowSidebar(false);
    };

    const handleBack = () => {
        setShowSidebar(true);
        setSelectedChat(null);
    };

    const handleSendVaultMedia = async (url, type) => {
        // Vault media logic simplified for E2EE demo
        toast.info("Media encryption active.");
    };

    return (
        <div className="h-screen w-full bg-slate-950 flex overflow-hidden relative">
            {/* Global Gradient Glow */}
            <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-[800px] h-[800px] bg-indigo-600/5 blur-[160px] pointer-events-none" />

            <AnimatePresence mode="wait">
                {showSidebar ? (
                    <motion.div
                        key="sidebar"
                        initial={{ opacity: 0, x: -20 }}
                        animate={{ opacity: 1, x: 0 }}
                        exit={{ opacity: 0, x: -20 }}
                        transition={{ duration: 0.3, ease: "easeOut" }}
                        className="w-full md:w-80 lg:w-[400px] h-full flex-shrink-0 z-20"
                    >
                        <Sidebar
                            myFriends={myFriends}
                            friendRequests={friendRequests}
                            onlineUsers={onlineUsers}
                            fetchFriends={fetchFriends}
                            fetchFriendRequests={fetchFriendRequests}
                            isUserOnline={isUserOnline}
                            getInitials={getInitials}
                            onSelectChat={handleSelectChat}
                            notification={notification}
                        />
                    </motion.div>
                ) : null}
            </AnimatePresence>

            <motion.div
                layout
                className={`flex-1 h-full z-10 ${showSidebar ? 'hidden md:flex' : 'flex'}`}
            >
                <ChatWindow
                    messages={messages}
                    loading={loading}
                    isTyping={isTyping}
                    onlineUsers={onlineUsers}
                    socket={socket}
                    socketConnected={socketConnected}
                    setMessages={setMessages}
                    getInitials={getInitials}
                    isUserOnline={isUserOnline}
                    onBack={handleBack}
                    onOpenVault={() => setIsVaultOpen(true)}
                />
            </motion.div>

            <Vault
                isOpen={isVaultOpen}
                onClose={() => setIsVaultOpen(false)}
                onSendToChat={handleSendVaultMedia}
                recipientId={selectedChat?._id}
            />
        </div>
    );

};

export default DashboardPage;

