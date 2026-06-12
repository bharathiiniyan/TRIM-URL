import express from 'express';
import { getUrlAnalytics, getPublicStats } from '../controllers/analyticsController.js';
import authMiddleware from '../middleware/authMiddleware.js';

const router = express.Router();

// GET /api/analytics/public/:shortCode - Publicly accessible stats
router.get('/public/:shortCode', getPublicStats);

// GET /api/analytics/:urlId - Private detailed analytics
router.get('/:urlId', authMiddleware, getUrlAnalytics);

export default router;
