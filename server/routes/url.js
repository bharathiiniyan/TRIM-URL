import express from 'express';
import { createShortUrl, getUserUrls, deleteUrl } from '../controllers/urlController.js';
import authMiddleware from '../middleware/authMiddleware.js';
import { validateUrl } from '../middleware/validators.js';

const router = express.Router();

// Apply authMiddleware to all routes in this router
router.use(authMiddleware);

// POST /api/urls - Create short URL
router.post('/', validateUrl, createShortUrl);

// GET /api/urls - Get all URLs for current user
router.get('/', getUserUrls);

// DELETE /api/urls/:id - Delete a URL
router.delete('/:id', deleteUrl);

export default router;
