import React, { useEffect, useState } from 'react';
import axios from 'axios';
import { useChatState } from '../context/ChatProvider';
import io from 'socket.io-client';
import { toast } from 'react-toastify';
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
    // On mobile: start showing sidebar (contact list). On desktop: sidebar always visible.
    const [showSidebar, setShowSidebar] = useState(true);
    const [isVaultOpen, setIsVaultOpen] = useState(false);
    const [friendRequests, setFriendRequests] = useState([]);
    const [myFriends, setMyFriends] = useState([]);
    const [onlineUsers, setOnlineUsers] = useState([]);

    // Fetch friends + requests immediately on login / page refresh
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
            toast.error("Failed to load friends");
        }
    };

    const fetchFriendRequests = async () => {
        if (!user) return;
        try {
            const config = { headers: { Authorization: `Bearer ${user.token}` } };
            const { data } = await axios.get(`${API_BASE_URL}/api/users/friend-requests`, config);
            setFriendRequests(data);
        } catch {
            toast.error("Failed to load requests");
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
            toast.error("Failed to load messages");
            setLoading(false);
        }
    };

    useEffect(() => {
        fetchMessages();
        selectedChatCompare = selectedChat;
    }, [selectedChat]);

    const getInitials = (name) => {
        if (!name) return '??';
        const parts = name.trim().split(' ');
        let ini = parts[0][0].toUpperCase();
        if (parts.length > 1) ini += parts[parts.length - 1][0].toUpperCase();
        return ini;
    };

    // Selecting a chat: on mobile → hide sidebar and show chat
    const handleSelectChat = (friend) => {
        setSelectedChat(friend);
        setShowSidebar(false);
    };

    // Going back: show sidebar, clear selected chat on mobile
    const handleBack = () => {
        setShowSidebar(true);
        setSelectedChat(null);
    };

    const handleSendVaultMedia = async (url, type) => {
        if (!selectedChat || !user) return;
        try {
            const config = {
                headers: {
                    "Content-type": "application/json",
                    Authorization: `Bearer ${user.token}`,
                },
            };
            const content = type === 'video' ? `[VIDEO] ${url}` : `[IMAGE] ${url}`;
            const { data } = await axios.post(`${API_BASE_URL}/api/chat`, {
                content,
                chatId: selectedChat._id,
            }, config);

            if (socket) {
                socket.emit("new message", {
                    chat: { users: [user, selectedChat] },
                    sender: user,
                    ...data
                });
            }
            setMessages((prev) => [...prev, data]);
            toast.success("Media sent to chat!");
        } catch (error) {
            toast.error("Failed to send media");
        }
    };

    return (
        <div className="app-height flex bg-white dark:bg-[#0b0e14] font-sans">

            {/* ── SIDEBAR ──
              * Mobile: full width, toggled visible/hidden
              * Desktop: fixed-width left column
              */}
            <div className={`
                h-full flex flex-col
                w-full md:w-80 lg:w-[350px] md:flex-shrink-0
                ${showSidebar ? 'flex' : 'hidden md:flex'}
            `}>
                <Sidebar
                    myFriends={myFriends}
                    friendRequests={friendRequests}
                    onlineUsers={onlineUsers}
                    fetchFriends={fetchFriends}
                    fetchFriendRequests={fetchFriendRequests}
                    setShowSidebar={setShowSidebar}
                    isUserOnline={isUserOnline}
                    getInitials={getInitials}
                    onSelectChat={handleSelectChat}
                    notification={notification}
                />
            </div>

            {/* ── CHAT WINDOW ──
              * Mobile: full width, shown when a chat is opened
              * Desktop: takes remaining flex space
              */}
            <div className={`
                flex-1 flex flex-col min-w-0 h-full
                ${showSidebar ? 'hidden md:flex' : 'flex'}
            `}>
                <ChatWindow
                    messages={messages}
                    loading={loading}
                    isTyping={isTyping}
                    onlineUsers={onlineUsers}
                    socket={socket}
                    socketConnected={socketConnected}
                    setMessages={setMessages}
                    setShowSidebar={setShowSidebar}
                    getInitials={getInitials}
                    isUserOnline={isUserOnline}
                    onBack={handleBack}
                    onOpenVault={() => setIsVaultOpen(true)}
                />
            </div>

            {/* Secret Vault */}
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
