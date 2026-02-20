const asyncHandler = require('express-async-handler');
const User = require('../models/userModel');
const generateToken = require('../utils/generateToken');
const bcrypt = require('bcryptjs');

// @desc    Register a new user
// @route   POST /api/users
// @access  Public
const registerUser = asyncHandler(async (req, res) => {
    const { name, email, password, username } = req.body;

    if (!name || !email || !password || !username) {
        res.status(400);
        throw new Error('Please fill all fields');
    }

    const userExists = await User.findOne({ email });
    const usernameExists = await User.findOne({ username });

    if (userExists || usernameExists) {
        res.status(400);
        throw new Error('User or Username already exists');
    }

    const user = await User.create({
        name,
        email,
        password,
        username,
    });

    if (user) {
        res.status(201).json({
            _id: user._id,
            name: user.name,
            email: user.email,
            username: user.username,
            vaultPassword: user.vaultPassword,
            customCode: user.customCode,
            token: generateToken(user._id),
        });
    } else {
        res.status(400);
        throw new Error('Invalid user data');
    }
});

// @desc    Auth user & get token
// @route   POST /api/users/login
// @access  Public
const authUser = asyncHandler(async (req, res) => {
    const { email, password } = req.body;

    const user = await User.findOne({ email });

    if (user && (await user.matchPassword(password))) {
        res.json({
            _id: user._id,
            name: user.name,
            email: user.email,
            username: user.username,
            vaultPassword: user.vaultPassword,
            customCode: user.customCode,
            token: generateToken(user._id),
        });
    } else {
        res.status(401);
        throw new Error('Invalid email or password');
    }
});

// @desc    Verify user for password reset (email only)
// @route   POST /api/users/forgot-password-verify
// @access  Public
const verifyForgotPassword = asyncHandler(async (req, res) => {
    const { email } = req.body;

    if (!email) {
        res.status(400);
        throw new Error('Email is required');
    }

    const user = await User.findOne({ email });

    if (user) {
        res.json({
            message: 'User verified',
            userId: user._id
        });
    } else {
        res.status(404);
        throw new Error('No account found with this email');
    }
});


// @desc    Reset password
// @route   PUT /api/users/reset-password
// @access  Public
const resetPassword = asyncHandler(async (req, res) => {
    const { userId, newPassword } = req.body;

    if (!userId || !newPassword) {
        res.status(400);
        throw new Error('Missing required fields');
    }

    const user = await User.findById(userId);

    if (user) {
        user.password = newPassword;
        await user.save();
        res.json({ message: 'Password updated successfully' });
    } else {
        res.status(404);
        throw new Error('User not found');
    }
});


// @desc    Search users
// @route   GET /api/users/search
// @access  Private
const searchUsers = asyncHandler(async (req, res) => {
    const keyword = req.query.search
        ? {
            username: { $regex: req.query.search, $options: 'i' },
        }
        : {};

    const query = {
        ...keyword,
        _id: { $ne: req.user._id }
    };
    const users = await User.find(query).select('-password');
    res.send(users);
});

// @desc    Update user profile
// @route   PUT /api/users/profile
// @access  Private
const updateUserProfile = asyncHandler(async (req, res) => {
    const user = await User.findById(req.user._id);

    if (user) {
        user.name = req.body.name || user.name;
        user.username = req.body.username || user.username;
        user.email = req.body.email || user.email;
        user.vaultPassword = req.body.vaultPassword || user.vaultPassword;
        user.customCode = req.body.customCode || user.customCode;

        if (req.body.password) {
            user.password = req.body.password;
        }

        const updatedUser = await user.save();

        res.json({
            _id: updatedUser._id,
            name: updatedUser.name,
            email: updatedUser.email,
            username: updatedUser.username,
            vaultPassword: updatedUser.vaultPassword,
            customCode: updatedUser.customCode,
            token: generateToken(updatedUser._id),
        });
    } else {
        res.status(404);
        throw new Error('User not found');
    }
});

// @desc    Send Friend Request
// @route   POST /api/users/friend-request
// @access  Private
const sendFriendRequest = asyncHandler(async (req, res) => {
    const { receiverId } = req.body;

    const sender = await User.findById(req.user._id);
    const receiver = await User.findById(receiverId);

    if (!receiver) {
        res.status(404);
        throw new Error('User not found');
    }

    // Check if already friends
    if (sender.friends.some(id => id.toString() === receiverId)) {
        res.status(400);
        throw new Error('Already friends');
    }

    // Check if request already sent
    if (receiver.friendRequestsReceived.some(id => id.toString() === sender._id.toString())) {
        res.status(400);
        throw new Error('Friend request already sent');
    }

    // Check if they already sent you a request (Cross-request check)
    if (sender.friendRequestsReceived.some(id => id.toString() === receiverId)) {
        res.status(400);
        throw new Error('This user has already sent you a request. Please accept it in your Requests tab.');
    }

    receiver.friendRequestsReceived.push(sender._id);
    sender.friendRequestsSent.push(receiver._id);

    await receiver.save();
    await sender.save();

    res.json({ message: 'Friend request sent' });
});

// @desc    Respond to Friend Request
// @route   POST /api/users/friend-request/respond
// @access  Private
const respondToFriendRequest = asyncHandler(async (req, res) => {
    const { senderId, action } = req.body; // action: 'accept' or 'reject'

    const user = await User.findById(req.user._id);
    const sender = await User.findById(senderId);

    if (!sender) {
        res.status(404);
        throw new Error('Sender not found');
    }

    if (!user.friendRequestsReceived.some(id => id.toString() === senderId)) {
        res.status(400);
        throw new Error('No friend request from this user');
    }

    // Remove from requests (on both sides)
    user.friendRequestsReceived = user.friendRequestsReceived.filter(id => id.toString() !== senderId);
    sender.friendRequestsSent = sender.friendRequestsSent.filter(id => id.toString() !== user._id.toString());

    // Also remove any inverse request if it exists (Crucial Fix for duplicates)
    user.friendRequestsSent = user.friendRequestsSent.filter(id => id.toString() !== senderId);
    sender.friendRequestsReceived = sender.friendRequestsReceived.filter(id => id.toString() !== user._id.toString());

    if (action === 'accept') {
        // Prevent duplicate entries in friends list
        if (!user.friends.some(id => id.toString() === senderId)) {
            user.friends.push(senderId);
        }
        if (!sender.friends.some(id => id.toString() === user._id.toString())) {
            sender.friends.push(user._id);
        }

        await sender.save();
        await user.save();
        res.json({ message: 'Friend request accepted' });
    } else {
        await sender.save();
        await user.save();
        res.json({ message: 'Friend request rejected' });
    }
});

// @desc    Get Friends
// @route   GET /api/users/friends
// @access  Private
const getFriends = asyncHandler(async (req, res) => {
    const user = await User.findById(req.user._id).populate('friends', '-password');
    res.json(user.friends);
});

// @desc    Get Friend Requests
// @route   GET /api/users/friend-requests
// @access  Private
const getFriendRequests = asyncHandler(async (req, res) => {
    const user = await User.findById(req.user._id).populate('friendRequestsReceived', '-password');
    res.json(user.friendRequestsReceived);
});


// @desc    Remove Friend & Delete Vault + Chat History
// @route   POST /api/users/remove-friend
// @access  Private
const removeFriend = asyncHandler(async (req, res) => {
    const { friendId } = req.body;
    const { deleteVault } = require('./vaultController');
    const Message = require('../models/messageModel');

    const user = await User.findById(req.user._id);
    const friend = await User.findById(friendId);

    if (!friend) {
        res.status(404);
        throw new Error('Friend not found');
    }

    // 1. Remove from mutual friends lists
    user.friends = user.friends.filter(id => id.toString() !== friendId);
    friend.friends = friend.friends.filter(id => id.toString() !== user._id.toString());

    await user.save();
    await friend.save();

    // 2. Hard-delete ALL shared messages from MongoDB
    await Message.deleteMany({
        $or: [
            { sender: user._id, receiver: friend._id },
            { sender: friend._id, receiver: user._id }
        ]
    });
    console.log(`[Chat] Deleted all messages between ${user._id} and ${friend._id}`);

    // 3. Identify and Wipe Cloudinary Vault
    const vaultId = [user._id.toString(), friend._id.toString()].sort().join('_');
    const wipeResult = await deleteVault(vaultId);

    res.json({
        message: 'Friend removed, chat history deleted, and vault wiped',
        vaultCleanup: wipeResult.success ? 'Success' : 'Failed (may not have existed)'
    });
});

module.exports = {
    registerUser,
    authUser,
    searchUsers,
    verifyForgotPassword,
    resetPassword,
    sendFriendRequest,
    respondToFriendRequest,
    getFriends,
    getFriendRequests,
    updateUserProfile,
    removeFriend
};
