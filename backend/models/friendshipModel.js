const mongoose = require('mongoose');

const friendshipSchema = mongoose.Schema(
    {
        user1: {
            type: mongoose.Schema.Types.ObjectId,
            ref: 'User',
            required: true,
        },
        user2: {
            type: mongoose.Schema.Types.ObjectId,
            ref: 'User',
            required: true,
        },
        vault_id: {
            type: mongoose.Schema.Types.ObjectId,
            ref: 'Vault',
            required: true,
        },
    },
    {
        timestamps: true,
    }
);

// Ensure unique friendship between two users
friendshipSchema.index({ user1: 1, user2: 1 }, { unique: true });

const Friendship = mongoose.model('Friendship', friendshipSchema);

module.exports = Friendship;
