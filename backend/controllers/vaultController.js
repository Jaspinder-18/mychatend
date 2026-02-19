const asyncHandler = require('express-async-handler');
const cloudinary = require('cloudinary').v2;
const { CloudinaryStorage } = require('multer-storage-cloudinary');
const multer = require('multer');

// Configure Cloudinary
cloudinary.config({
    cloud_name: process.env.CLOUDINARY_CLOUD_NAME,
    api_key: process.env.CLOUDINARY_API_KEY,
    api_secret: process.env.CLOUDINARY_API_SECRET,
});

// Configure Storage
const storage = new CloudinaryStorage({
    cloudinary: cloudinary,
    params: async (req, file) => {
        const isVideo = file.mimetype.startsWith('video');
        return {
            folder: 'secret_vault',
            resource_type: isVideo ? 'video' : 'image',
            allowed_formats: ['jpg', 'png', 'jpeg', 'mp4', 'mov', 'webm'],
            public_id: `vault_${Date.now()}`,
        };
    },
});

const upload = multer({ storage: storage });

// @desc    Get all vault media
// @route   GET /api/vault
// @access  Private
const getVaultMedia = asyncHandler(async (req, res) => {
    try {
        // Fetch images
        const images = await cloudinary.api.resources({
            type: 'upload',
            prefix: 'secret_vault/',
            max_results: 100,
            resource_type: 'image'
        });

        // Fetch videos
        const videos = await cloudinary.api.resources({
            type: 'upload',
            prefix: 'secret_vault/',
            max_results: 100,
            resource_type: 'video'
        });

        const allMedia = [
            ...images.resources.map(r => ({ ...r, type: 'image' })),
            ...videos.resources.map(r => ({ ...r, type: 'video' }))
        ].sort((a, b) => new Date(b.created_at) - new Date(a.created_at));

        res.json(allMedia);
    } catch (error) {
        console.error("Cloudinary Fetch Error:", error);
        res.status(500).json({ message: "Error fetching from cloud", error: error.message });
    }
});

// @desc    Delete media
// @route   DELETE /api/vault/:publicId
// @access  Private
const deleteVaultMedia = asyncHandler(async (req, res) => {
    const { publicId } = req.params;
    const { type } = req.query; // image or video

    try {
        const result = await cloudinary.uploader.destroy(publicId, { resource_type: type || 'image' });
        res.json({ message: "Deleted successfully", result });
    } catch (error) {
        res.status(500).json({ message: "Delete failed", error: error.message });
    }
});

// @desc    Upload media
// @route   POST /api/vault/upload
// @access  Private
const uploadMedia = asyncHandler(async (req, res) => {
    if (!req.file) {
        res.status(400);
        throw new Error("No file uploaded");
    }
    res.json({
        message: "Uploaded successfully",
        url: req.file.path,
        public_id: req.file.filename,
        resource_type: req.file.mimetype.startsWith('video') ? 'video' : 'image'
    });
});

module.exports = {
    getVaultMedia,
    deleteVaultMedia,
    uploadMedia,
    upload
};
