const mongoose = require('mongoose');
const bcrypt = require('bcryptjs');

const userSchema = mongoose.Schema(
    {
        username: {
            type: String,
            unique: true,
            required: true,
            trim: true,
            index: true,
        },
        email: {
            type: String,
            required: true,
            unique: true,
            trim: true,
            lowercase: true,
        },
        password: {
            type: String,
            required: true,
        },
        trigger_hash: {
            type: String,
            required: true,
        },
        is_verified: {
            type: Boolean,
            default: false,
        },
        public_key: {
            type: String,
        },
        ghost_mode: {
            hide_online: { type: Boolean, default: false },
            disable_typing: { type: Boolean, default: false },
            disable_read_receipts: { type: Boolean, default: false },
        },
        decoy_mode: {
            is_active: { type: Boolean, default: false },
            decoy_password_hash: { type: String },
        },
        // Legacy support/extra fields if needed, but keeping it minimal as per Section 8

        friends: [
            {
                type: mongoose.Schema.Types.ObjectId,
                ref: 'User',
            },
        ],
        friendRequestsSent: [
            {
                type: mongoose.Schema.Types.ObjectId,
                ref: 'User',
            },
        ],
        friendRequestsReceived: [
            {
                type: mongoose.Schema.Types.ObjectId,
                ref: 'User',
            },
        ],
    },
    {
        timestamps: true,
    }
);

userSchema.methods.matchPassword = async function (enteredPassword) {
    return await bcrypt.compare(enteredPassword, this.password);
};

userSchema.methods.matchTrigger = async function (enteredTrigger) {
    return await bcrypt.compare(enteredTrigger, this.trigger_hash);
};

userSchema.pre('save', async function (next) {
    if (this.isModified('password')) {
        const salt = await bcrypt.genSalt(10);
        this.password = await bcrypt.hash(this.password, salt);
    }

    if (this.isModified('trigger_hash')) {
        const salt = await bcrypt.genSalt(10);
        this.trigger_hash = await bcrypt.hash(this.trigger_hash, salt);
    }

    next();
});

const User = mongoose.model('User', userSchema);

module.exports = User;

