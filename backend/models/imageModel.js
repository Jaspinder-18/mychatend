const mongoose = require('mongoose');

const imageSchema = mongoose.Schema(
    {
        vault_id: {
            type: mongoose.Schema.Types.ObjectId,
            ref: 'Vault',
            required: true,
        },
        uploader: {
            type: mongoose.Schema.Types.ObjectId,
            ref: 'User',
            required: true,
        },
        encrypted_image_url: {
            type: String,
            required: true,
        },
        cloudinary_public_id: {
            type: String,
        }
    },
    {
        timestamps: true,
    }
);

const Image = mongoose.model('Image', imageSchema);

module.exports = Image;
