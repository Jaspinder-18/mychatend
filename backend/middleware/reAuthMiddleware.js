const asyncHandler = require('express-async-handler');
const User = require('../models/userModel');

const requireReAuth = asyncHandler(async (req, res, next) => {
    const { currentPassword } = req.body;

    if (!currentPassword) {
        res.status(401);
        throw new Error('Please provide your current password for re-authentication');
    }

    const user = await User.findById(req.user._id);

    if (user && (await user.matchPassword(currentPassword))) {
        next();
    } else {
        res.status(401);
        throw new Error('Invalid current password');
    }
});

module.exports = { requireReAuth };
