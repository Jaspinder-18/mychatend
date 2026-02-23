const asyncHandler = require('express-async-handler');
const Message = require('../models/messageModel');
const User = require('../models/userModel');

// @desc    Send Message
// @route   POST /api/chat
// @access  Private
const sendMessage = asyncHandler(async (req, res) => {
    const { chatId, encrypted_message, duration } = req.body; // duration in hours
    console.log(`[Chat] Incoming message from ${req.user._id} to ${chatId}`);

    if (!chatId || !encrypted_message) {
        console.log("[Chat] Validation Failed: Missing chatId or encrypted_message");
        res.status(400);
        throw new Error("Invalid data passed into request");
    }

    // Check if friends
    const sender = await User.findById(req.user._id);
    const isFriend = sender.friends.some(friend => friend.toString() === chatId);

    if (!isFriend) {
        console.log(`[Chat] Security Denied: ${req.user._id} tried to message ${chatId} but they are not linked in friends array.`);
        res.status(403);
        return res.json({ message: 'You can only chat with friends' });
    }

    let expires_at = null;
    if (duration) {
        expires_at = new Date(Date.now() + duration * 60 * 60 * 1000);
    }

    const newMessage = {
        sender: req.user._id,
        receiver: chatId,
        encrypted_message,
        expires_at,
    };

    try {
        let message = await Message.create(newMessage);
        message = await message.populate("sender", "username public_key");
        message = await message.populate("receiver", "username public_key");

        res.json(message);
    } catch (error) {
        res.status(400);
        throw new Error(error.message);
    }
});

// @desc    Fetch Messages
// @route   GET /api/chat/:userId
// @access  Private
const getMessages = asyncHandler(async (req, res) => {
    try {
        const messages = await Message.find({
            $or: [
                { sender: req.user._id, receiver: req.params.userId },
                { sender: req.params.userId, receiver: req.user._id }
            ]
        })
            .populate("sender", "username public_key")
            .populate("receiver", "username public_key")
            .sort({ createdAt: 1 });

        res.json(messages);
    } catch (error) {
        res.status(400);
        throw new Error(error.message);
    }
});

// @desc    Delete Chat (Clear history for both or self)
// @route   DELETE /api/chat/:userId
// @access  Private
const deleteChat = asyncHandler(async (req, res) => {
    const otherUserId = req.params.userId;

    // Hard delete for enterprise-grade privacy
    await Message.deleteMany({
        $or: [
            { sender: req.user._id, receiver: otherUserId },
            { sender: otherUserId, receiver: req.user._id }
        ]
    });

    res.json({ message: 'Chat deleted for both parties' });
});

module.exports = { sendMessage, getMessages, deleteChat };

