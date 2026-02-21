const asyncHandler = require('express-async-handler');
const User = require('../models/userModel');
const EmailVerificationToken = require('../models/verificationTokenModel');
const Friendship = require('../models/friendshipModel');
const Vault = require('../models/vaultModel');
const generateToken = require('../utils/generateToken');
const sendEmail = require('../utils/sendEmail');
const bcrypt = require('bcryptjs');
const crypto = require('crypto');


// @desc    Register a new user
// @route   POST /api/users
// @access  Public
const registerUser = asyncHandler(async (req, res) => {
    const { email, password, username, triggerCode } = req.body;

    if (!email || !password || !username || !triggerCode) {
        res.status(400);
        throw new Error('Please fill all fields');
    }

    const userExists = await User.findOne({ email });
    const usernameExists = await User.findOne({ username });

    if (userExists || usernameExists) {
        res.status(400);
        throw new Error('User or Username already exists');
    }

    // Create user but NOT verified
    const user = await User.create({
        email,
        password,
        username,
        trigger_hash: triggerCode,
        is_verified: false,
    });

    if (user) {
        // Generate verification token
        const verificationToken = crypto.randomBytes(32).toString('hex');
        const hashedToken = crypto.createHash('sha256').update(verificationToken).digest('hex');

        await EmailVerificationToken.create({
            user_id: user._id,
            hashed_token: hashedToken,
            expires_at: Date.now() + 30 * 60 * 1000, // 30 minutes
        });

        const verificationUrl = `${process.env.FRONTEND_URL}/verify-email?token=${verificationToken}`;

        const message = `
            <h1>Email Verification</h1>
            <p>Please verify your email by clicking the link below:</p>
            <a href="${verificationUrl}" clicktracking=off>${verificationUrl}</a>
        `;

        try {
            await sendEmail({
                email: user.email,
                subject: 'Verify your Antigravity Chat account',
                html: message,
            });

            res.status(201).json({
                message: 'Registration successful. Please check your email to verify your account.',
            });
        } catch (error) {
            console.error('Email send error:', error);
            res.status(500);
            throw new Error('Email could not be sent. Please try again later.');
        }
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
        if (!user.is_verified) {
            res.status(401);
            throw new Error('Please verify your email first');
        }

        res.json({
            _id: user._id,
            email: user.email,
            username: user.username,
            public_key: user.public_key,
            token: generateToken(user._id),
        });
    } else {
        res.status(401);
        throw new Error('Invalid email or password');
    }
});

// @desc    Verify Email
// @route   POST /api/users/verify-email
// @access  Public
const verifyEmail = asyncHandler(async (req, res) => {
    const { token } = req.body;

    const hashedToken = crypto.createHash('sha256').update(token).digest('hex');

    const verificationToken = await EmailVerificationToken.findOne({
        hashed_token: hashedToken,
        expires_at: { $gt: Date.now() },
        used: false,
    });

    if (!verificationToken) {
        res.status(400);
        throw new Error('Invalid or expired token');
    }

    const user = await User.findById(verificationToken.user_id);

    if (!user) {
        res.status(404);
        throw new Error('User not found');
    }

    user.is_verified = true;
    await user.save();

    verificationToken.used = true;
    await verificationToken.save();

    res.json({ message: 'Email verified successfully' });
});

// @desc    Resend Verification Email
// @route   POST /api/users/resend-verification
// @access  Public
const resendVerificationEmail = asyncHandler(async (req, res) => {
    const { email } = req.body;

    const user = await User.findOne({ email });

    if (!user) {
        res.status(404);
        throw new Error('User not found');
    }

    if (user.is_verified) {
        res.status(400);
        throw new Error('Email is already verified');
    }

    // Rate limiting logic could be added here or via middleware
    // For now, generate new token
    const verificationToken = crypto.randomBytes(32).toString('hex');
    const hashedToken = crypto.createHash('sha256').update(verificationToken).digest('hex');

    await EmailVerificationToken.create({
        user_id: user._id,
        hashed_token: hashedToken,
        expires_at: Date.now() + 3 * 60 * 1000, // 30 minutes
    });

    const verificationUrl = `${process.env.FRONTEND_URL}/verify-email?token=${verificationToken}`;

    const message = `
        <h1>Email Verification</h1>
        <p>Please verify your email by clicking the link below:</p>
        <a href="${verificationUrl}" clicktracking=off>${verificationUrl}</a>
    `;

    await sendEmail({
        email: user.email,
        subject: 'Verify your Antigravity Chat account',
        html: message,
    });

    res.json({ message: 'Verification email sent' });
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

        // --- NEW: Create Vault and Friendship ---
        // Generate a random vault encryption key (this will be encrypted on frontend before being sent here, 
        // OR we can generate it here and the user will encrypt it with their vault password later? 
        // Actually, Step 3.1 says "encrypted_vault_key". 
        // For now, we'll create the Vault object and the Friendship. 
        // The frontend will be responsible for setting the encrypted_vault_key upon first unlock or at creation.

        const vault = await Vault.create({
            encrypted_vault_key: 'PENDING', // Will be set by frontend
        });

        await Friendship.create({
            user1: user._id,
            user2: senderId,
            vault_id: vault._id,
        });
        // --- END NEW ---

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

    // 3. Identify and Wipe Cloudinary Vault & DB Records
    const friendship = await Friendship.findOne({
        $or: [
            { user1: user._id, user2: friend._id },
            { user1: friend._id, user2: user._id }
        ]
    });

    let wipeResult = { success: false };
    if (friendship) {
        const vaultId = friendship.vault_id;
        wipeResult = await deleteVault(vaultId);

        // Delete Friendship and Vault records
        await Vault.findByIdAndDelete(vaultId);
        await Friendship.findByIdAndDelete(friendship._id);
    }

    res.json({
        message: 'Friend removed, chat history deleted, and vault wiped',
        vaultCleanup: wipeResult.success ? 'Success' : 'Failed or not found'
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
