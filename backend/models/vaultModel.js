const mongoose = require('mongoose');

const vaultSchema = mongoose.Schema(
    {
        encrypted_vault_key: {
            type: String,
            required: true,
        },
        failed_attempts: {
            type: Number,
            default: 0,
        },
        lock_until: {
            type: Date,
        },
    },
    {
        timestamps: true,
    }
);

const Vault = mongoose.model('Vault', vaultSchema);

module.exports = Vault;
