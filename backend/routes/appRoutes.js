const express = require('express');
const router = express.Router();

// @desc    Get latest app version and download link
// @route   GET /api/app/version
// @access  Public
router.get('/version', (req, res) => {
    res.json({
        version: process.env.APP_VERSION || "1.0.0",
        downloadUrl: process.env.APK_DOWNLOAD_URL || ""
    });
});

module.exports = router;
