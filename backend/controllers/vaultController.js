const asyncHandler = require('express-async-handler');
const cloudinary = require('cloudinary').v2;
const { CloudinaryStorage } = require('multer-storage-cloudinary');
const multer = require('multer');

// Configure Cloudinary
const cloudinaryConfig = {
    cloud_name: (process.env.CLOUDINARY_CLOUD_NAME || "").trim(),
    api_key: (process.env.CLOUDINARY_API_KEY || "").trim(),
    api_secret: (process.env.CLOUDINARY_API_SECRET || "").trim(),
};
cloudinary.config(cloudinaryConfig);

console.log("[Cloudinary] Configured with Name:", cloudinaryConfig.cloud_name);
if (cloudinaryConfig.api_secret) {
    const s = cloudinaryConfig.api_secret;
    console.log(`[Cloudinary] Secret Check: ${s[0]}...${s.slice(-1)} (Length: ${s.length})`);
} else {
    console.error("[Cloudinary] ERROR: API_SECRET is missing!");
}

// Helper to get Vault ID
const getVaultId = (user1, user2) => {
    return [user1, user2].sort().join('_');
};

/**
 * Ensures the specific vault folder exists in Cloudinary.
 * Designed to be called when the vault is 'triggered' (#mypic) or during upload.
 */
const ensureVaultFolderExists = async (vaultId) => {
    try {
        const folderPath = `secret_vault/chat_vaults/${vaultId}`;
        console.log(`[Vault] Checking/Creating folder: ${folderPath}`);
        // create_folder is idempotent (won't error if it exists)
        await cloudinary.api.create_folder(folderPath);
        return true;
    } catch (error) {
        console.error("[Vault] Folder Ensure Error:", error.message);
        return false;
    }
};

// Configure Storage - Use memory storage for more control over Cloudinary upload
const storage = multer.memoryStorage();
const upload = multer({ storage: storage });

// @desc    Upload media
// @route   POST /api/vault/upload
// @access  Private
const uploadMedia = asyncHandler(async (req, res) => {
    if (!req.file) {
        res.status(400);
        throw new Error("No file uploaded");
    }

    const { recipientId } = req.query;
    if (!recipientId) {
        res.status(400);
        throw new Error("Recipient ID is required");
    }

    const vaultId = getVaultId(req.user._id.toString(), recipientId);
    await ensureVaultFolderExists(vaultId); // Ensure folder exists at trigger/upload time
    const isVideo = req.file.mimetype.startsWith('video');

    // We wrap the buffer upload in a promise
    const streamUpload = (req) => {
        return new Promise((resolve, reject) => {
            const stream = cloudinary.uploader.upload_stream(
                {
                    folder: `secret_vault/chat_vaults/${vaultId}`,
                    resource_type: isVideo ? 'video' : 'image',
                    public_id: `vault_${Date.now()}`,
                },
                (error, result) => {
                    if (result) {
                        resolve(result);
                    } else {
                        reject(error);
                    }
                }
            );
            stream.end(req.file.buffer);
        });
    };

    try {
        console.log(`[Vault] Streaming upload to Cloudinary for vault: ${vaultId}`);
        const result = await streamUpload(req);

        res.json({
            message: "Uploaded successfully",
            url: result.secure_url,
            public_id: result.public_id,
            resource_type: result.resource_type
        });
    } catch (error) {
        console.error("Cloudinary Upload Error:", error);
        res.status(500).json({ message: "Upload to Cloudinary failed", error: error.message });
    }
});

// @desc    Get all vault media for a specific chat
// @route   GET /api/vault?recipientId=...
// @access  Private
const getVaultMedia = asyncHandler(async (req, res) => {
    const { recipientId } = req.query;

    if (!recipientId) {
        res.status(400);
        throw new Error("Recipient ID is required to access chat-specific vault.");
    }

    // Check for placeholder credentials
    if (process.env.CLOUDINARY_CLOUD_NAME === 'your_cloud_name') {
        return res.status(500).json({
            message: "Cloudinary is not configured. Please set real credentials in backend/.env file.",
            error: "MISSING_CONFIG"
        });
    }

    const vaultId = getVaultId(req.user._id.toString(), recipientId);
    await ensureVaultFolderExists(vaultId); // Ensure folder exists at trigger/upload time
    const prefix = `secret_vault/chat_vaults/${vaultId}/`;

    console.log(`[Vault] Fetching media from prefix: ${prefix}`);

    try {
        // Fetch images
        const images = await cloudinary.api.resources({
            type: 'upload',
            prefix: prefix,
            max_results: 100,
            resource_type: 'image'
        }).catch(() => ({ resources: [] })); // Handle potential errors gracefully

        // Fetch videos
        const videos = await cloudinary.api.resources({
            type: 'upload',
            prefix: prefix,
            max_results: 100,
            resource_type: 'video'
        }).catch(() => ({ resources: [] }));

        const allMedia = [
            ...images.resources.map(r => ({ ...r, type: 'image' })),
            ...videos.resources.map(r => ({ ...r, type: 'video' }))
        ].sort((a, b) => new Date(b.created_at) - new Date(a.created_at));

        res.json(allMedia);
    } catch (error) {
        console.error("Vault Fetch Error:", error);
        res.status(500).json({
            message: "Cloudinary error. Check if your API Key/Secret are correct.",
            error: error.message
        });
    }
});

// @desc    Delete media
// @route   POST /api/vault/delete
// @access  Private
const deleteVaultMedia = asyncHandler(async (req, res) => {
    const { publicId, type } = req.body;

    if (!publicId) {
        res.status(400);
        throw new Error("Public ID is required");
    }

    try {
        const result = await cloudinary.uploader.destroy(publicId, { resource_type: type || 'image' });
        res.json({ message: "Deleted successfully", result });
    } catch (error) {
        res.status(500).json({ message: "Delete failed", error: error.message });
    }
});

module.exports = {
    getVaultMedia,
    deleteVaultMedia,
    uploadMedia,
    upload
};
