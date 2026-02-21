const express = require('express');
const router = express.Router();
const { protect } = require('../middleware/authMiddleware');
const {
    getVaultDetails,
    reportFailedAttempt,
    resetAttempts,
    updateVaultKey,
    deleteVaultMedia,
    uploadMedia,
    upload
} = require('../controllers/vaultController');

router.get('/details', protect, getVaultDetails);
router.post('/fail', protect, reportFailedAttempt);
router.post('/reset', protect, resetAttempts);
router.put('/key', protect, updateVaultKey);
router.post('/upload', protect, upload.single('file'), uploadMedia);
router.post('/delete', protect, deleteVaultMedia);


module.exports = router;
