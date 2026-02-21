const mongoose = require('mongoose');

const messageSchema = mongoose.Schema(
    {
        sender: {
            type: mongoose.Schema.Types.ObjectId,
            ref: 'User',
            required: true,
        },
        receiver: {
            type: mongoose.Schema.Types.ObjectId,
            ref: 'User',
            required: true,
        },
        encrypted_message: {
            type: String,
            required: true,
        },
        // For self-destructing messages
        expires_at: {
            type: Date,
        },
    },
    {
        timestamps: true,
    }
);

// Optional: Auto-delete expired messages if self-destruct is set
messageSchema.index({ expires_at: 1 }, { expireAfterSeconds: 0 });

const Message = mongoose.model('Message', messageSchema);

module.exports = Message;

