const express = require('express');
const router = express.Router();
const blogController = require('../controllers/blogController');
const authMiddleware = require('../middleware/auth');
const upload = require('../middleware/upload');

// Public routes
router.get('/', blogController.getBlogs);
router.get('/:id', blogController.getBlogById);

// Protected routes
router.get('/user/me', authMiddleware, blogController.getMyBlogs);
router.post('/', authMiddleware, blogController.createBlog);
router.put('/:id', authMiddleware, blogController.updateBlog);
router.delete('/:id', authMiddleware, blogController.deleteBlog);
router.post('/upload-image', authMiddleware, upload.single('image'), blogController.uploadBlogImage);

// Likes and Comments routes
const interactionController = require('../controllers/interactionController');

router.get('/:id/likes', interactionController.getLikes);
router.post('/:id/like', authMiddleware, interactionController.toggleLike);

router.get('/:id/comments', interactionController.getComments);
router.post('/:id/comments', authMiddleware, interactionController.addComment);
router.delete('/:id/comments/:commentId', authMiddleware, interactionController.deleteComment);

module.exports = router;
