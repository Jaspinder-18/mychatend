const asyncHandler = require('express-async-handler');
const Message = require('../models/messageModel');
const User = require('../models/userModel');

// @desc    Send Message
// @route   POST /api/chat
// @access  Private
const sendMessage = asyncHandler(async (req, res) => {
    const { chatId, content, replyTo } = req.body; // chatId is the receiver's userId

    if (!chatId || !content) {
        console.log("Invalid data passed into request");
        return res.sendStatus(400);
    }

    // Check if friends
    const sender = await User.findById(req.user._id);
    const isFriend = sender.friends.some(friend => friend.toString() === chatId);
    if (!isFriend) {
        res.status(403);
        return res.json({ message: 'You can only chat with friends' });
    }

    var newMessage = {
        sender: req.user._id,
        receiver: chatId,
        text: content,
        replyTo: replyTo || null,
    };

    try {
        var message = await Message.create(newMessage);
        message = await message.populate("sender", "name pic");
        message = await message.populate("receiver", "name pic");
        if (replyTo) {
            message = await message.populate({
                path: "replyTo",
                populate: { path: "sender", select: "name" }
            });
        }

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
            .populate("sender", "name email")
            .populate("receiver", "name email")
            .populate({
                path: "replyTo",
                populate: { path: "sender", select: "name" }
            })
            .sort({ createdAt: 1 });

        // Filter out messages deleted by current user
        const filteredMessages = messages.filter(msg => !msg.deletedBy.includes(req.user._id));

        res.json(filteredMessages);
    } catch (error) {
        res.status(400);
        throw new Error(error.message);
    }
});

// @desc    Delete Chat (Clear history for self)
// @route   PUT /api/chat/delete/:userId
// @access  Private
const deleteChat = asyncHandler(async (req, res) => {
    const otherUserId = req.params.userId;

    await Message.updateMany(
        {
            $or: [
                { sender: req.user._id, receiver: otherUserId },
                { sender: otherUserId, receiver: req.user._id }
            ]
        },
        {
            $addToSet: { deletedBy: req.user._id }
        }
    );

    res.json({ message: 'Chat cleared successfully' });
});

module.exports = { sendMessage, getMessages, deleteChat };
