const express = require('express');
const {
    registerUser,
    authUser,
    searchUsers,
    verifyForgotPassword,
    resetPassword,
    sendFriendRequest,
    respondToFriendRequest,
    getFriends,
    getFriendRequests,
    updateUserProfile
} = require('../controllers/userController');
const { protect } = require('../middleware/authMiddleware');

const router = express.Router();

router.route('/').post(registerUser).get(protect, searchUsers);
router.post('/login', authUser);
router.post('/forgot-password-verify', verifyForgotPassword);
router.put('/reset-password', resetPassword);

router.post('/friend-request', protect, sendFriendRequest);
router.post('/friend-request/respond', protect, respondToFriendRequest);
router.get('/friends', protect, getFriends);
router.get('/friend-requests', protect, getFriendRequests);
router.route('/profile').put(protect, updateUserProfile);
router.get('/search', protect, searchUsers);

module.exports = router;
