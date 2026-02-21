const asyncHandler = require('express-async-handler');
const Vault = require('../models/vaultModel');
const Friendship = require('../models/friendshipModel');
const Image = require('../models/imageModel');
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

// Helper to get Vault from Friendship
const getVaultByRelationship = async (user1, user2) => {
    const friendship = await Friendship.findOne({
        $or: [
            { user1, user2 },
            { user1: user2, user2: user1 }
        ]
    });
    if (!friendship) return null;
    return await Vault.findById(friendship.vault_id);
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

const getVaultId = async (user1, user2) => {
    const friendship = await Friendship.findOne({
        $or: [
            { user1, user2 },
            { user1: user2, user2: user1 }
        ]
    });
    return friendship ? friendship.vault_id.toString() : null;
};

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

    const vaultId = await getVaultId(req.user._id, recipientId);
    if (!vaultId) {
        res.status(404);
        throw new Error("Vault connection not established");
    }

    await ensureVaultFolderExists(vaultId);
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

// @desc    Get Vault Details (and handle unlock attempt)
// @route   GET /api/vault/details?recipientId=...
// @access  Private
const getVaultDetails = asyncHandler(async (req, res) => {
    const { recipientId } = req.query;
    const vault = await getVaultByRelationship(req.user._id, recipientId);

    if (!vault) {
        res.status(404);
        throw new Error("Vault not found");
    }

    // Check if locked
    if (vault.lock_until && vault.lock_until > Date.now()) {
        const remaining = Math.round((vault.lock_until - Date.now()) / 1000 / 60);
        res.status(403);
        throw new Error(`Vault is locked. Try again in ${remaining} minutes.`);
    }

    res.json({
        vault_id: vault._id,
        encrypted_vault_key: vault.encrypted_vault_key,
        failed_attempts: vault.failed_attempts,
    });
});

// @desc    Report Failed Unlock Attempt
// @route   POST /api/vault/fail
// @access  Private
const reportFailedAttempt = asyncHandler(async (req, res) => {
    const { vaultId } = req.body;
    const vault = await Vault.findById(vaultId);

    if (!vault) {
        res.status(404);
        throw new Error("Vault not found");
    }

    vault.failed_attempts += 1;

    if (vault.failed_attempts >= 5) {
        // Force re-authentication (this will be handled by frontend logging out or invalidating session)
        // Reset attempts but keep lock logic
        vault.failed_attempts = 0;
        await vault.save();
        return res.status(401).json({ message: "Too many attempts. Re-authentication required.", forceLogout: true });
    }

    if (vault.failed_attempts >= 3) {
        vault.lock_until = Date.now() + 24 * 60 * 60 * 1000; // 24 hours
    }

    await vault.save();
    res.json({ message: "Attempt recorded", failed_attempts: vault.failed_attempts, lock_until: vault.lock_until });
});

// @desc    Reset Failed Attempts (on successful unlock)
// @route   POST /api/vault/reset
// @access  Private
const resetAttempts = asyncHandler(async (req, res) => {
    const { vaultId } = req.body;
    const vault = await Vault.findById(vaultId);

    if (vault) {
        vault.failed_attempts = 0;
        vault.lock_until = null;
        await vault.save();
    }

    res.json({ message: "Attempts reset" });
});

// @desc    Update Vault Key (e.g. at creation or when changing vault password)
// @route   PUT /api/vault/key
// @access  Private
const updateVaultKey = asyncHandler(async (req, res) => {
    const { vaultId, encrypted_vault_key } = req.body;
    const vault = await Vault.findById(vaultId);

    if (!vault) {
        res.status(404);
        throw new Error("Vault not found");
    }

    vault.encrypted_vault_key = encrypted_vault_key;
    await vault.save();

    res.json({ message: "Vault key updated" });
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

// @desc    Get all media in a vault
// @route   GET /api/vault/media?recipientId=...
// @access  Private
const getVaultMedia = asyncHandler(async (req, res) => {
    const { recipientId } = req.query;
    const vaultId = await getVaultId(req.user._id, recipientId);

    if (!vaultId) {
        res.status(404);
        throw new Error("Vault not found");
    }

    try {
        const { resources } = await cloudinary.api.resources({
            type: 'upload',
            prefix: `secret_vault/chat_vaults/${vaultId}/`,
            max_results: 100
        });
        res.json(resources);
    } catch (error) {
        res.status(500).json({ message: "Cloudinary fetch failed", error: error.message });
    }
});

// @desc    Delete entire vault (used when unfriending)
// @route   INTERNAL (called by userController)
const deleteVault = async (vaultId) => {
    try {
        const prefix = `secret_vault/chat_vaults/${vaultId}/`;
        console.log(`[Vault] Wiping entire vault: ${prefix}`);

        // 1. Delete all resources in the folder
        await cloudinary.api.delete_resources_by_prefix(prefix);

        // 2. Delete the folder itself
        // Note: delete_folder only works if the folder is empty. 
        // We just deleted resources above, but there's a slight delay sometimes.
        await cloudinary.api.delete_folder(`secret_vault/chat_vaults/${vaultId}`);

        console.log(`[Vault] Successfully deleted vault folder: ${vaultId}`);
        return { success: true };
    } catch (error) {
        console.error("[Vault] Delete Vault Error:", error.message);
        return { success: false, error: error.message };
    }
};

module.exports = {
    getVaultDetails,
    reportFailedAttempt,
    resetAttempts,
    updateVaultKey,
    getVaultMedia,
    deleteVaultMedia,
    uploadMedia,
    upload,
    deleteVault
};
