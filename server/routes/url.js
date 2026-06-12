import express from 'express';
import { createShortUrl, getUserUrls, deleteUrl, updateUrl, bulkCreateUrls } from '../controllers/urlController.js';
import authMiddleware from '../middleware/authMiddleware.js';
import { validateUrl, validateUrlUpdate } from '../middleware/validators.js';

const router = express.Router();

// Apply authMiddleware to all routes in this router
router.use(authMiddleware);

// POST /api/urls - Create short URL
router.post('/', validateUrl, createShortUrl);

// GET /api/urls - Get all URLs for current user
router.get('/', getUserUrls);

// DELETE /api/urls/:id - Delete a URL
router.delete('/:id', deleteUrl);

// PUT /api/urls/:id - Update destination URL
router.put('/:id', validateUrlUpdate, updateUrl);

// POST /api/urls/bulk - Bulk create shortened URLs
router.post('/bulk', bulkCreateUrls);

export default router;

