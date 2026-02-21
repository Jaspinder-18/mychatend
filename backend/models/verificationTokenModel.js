const mongoose = require('mongoose');

const verificationTokenSchema = mongoose.Schema(
    {
        user_id: {
            type: mongoose.Schema.Types.ObjectId,
            ref: 'User',
            required: true,
        },
        hashed_token: {
            type: String,
            required: true,
        },
        expires_at: {
            type: Date,
            required: true,
        },
        used: {
            type: Boolean,
            default: false,
        },
    },
    {
        timestamps: true,
    }
);

// Auto-delete expired tokens
verificationTokenSchema.index({ expires_at: 1 }, { expireAfterSeconds: 0 });

const EmailVerificationToken = mongoose.model('EmailVerificationToken', verificationTokenSchema);

module.exports = EmailVerificationToken;
