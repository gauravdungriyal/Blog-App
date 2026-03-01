const express = require('express');
const router = express.Router();
const userController = require('../controllers/userController');
const authMiddleware = require('../middleware/auth');

const upload = require('../middleware/upload');

// Public routes
router.get('/search', userController.searchUsers);
router.get('/username/:username', userController.getUserByUsername);
router.get('/:id/follow-status', userController.getFollowStatus);
router.get('/:id/followers', userController.getFollowers);
router.get('/:id/following', userController.getFollowing);

// Protected routes
router.post('/:id/follow', authMiddleware, userController.toggleFollow);
router.get('/me/stats', authMiddleware, userController.getDashboardStats);
router.put('/profile', authMiddleware, userController.updateProfile);
router.post('/upload-avatar', authMiddleware, upload.single('avatar'), userController.uploadAvatar);

module.exports = router;
