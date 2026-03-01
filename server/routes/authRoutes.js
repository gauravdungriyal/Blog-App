const express = require('express');
const router = express.Router();
const authController = require('../controllers/authController');

router.post('/logout', authController.logout);

// OAuth routes
router.get('/google', authController.googleLogin);
router.get('/google/callback', authController.googleCallback);
router.post('/google/session', authController.googleSession);

module.exports = router;
