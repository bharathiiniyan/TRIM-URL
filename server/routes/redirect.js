import express from 'express';
import rateLimit from 'express-rate-limit';
import Url from '../models/Url.js';
import Click from '../models/Click.js';
import useragent from 'useragent';

const router = express.Router();

// Redirection rate limit: max 100 requests per 15 minutes per IP
const redirectLimiter = rateLimit({
  windowMs: 15 * 60 * 1000,
  max: 100,
  message: { error: 'Too many redirection requests from this IP. Please try again later.' },
  standardHeaders: true,
  legacyHeaders: false
});

// GET /r/:shortCode
router.get('/:shortCode', redirectLimiter, async (req, res) => {
  const { shortCode } = req.params;

  try {
    // Find URL by shortCode
    const url = await Url.findOne({ shortCode });
    if (!url) {
      return res.status(404).send('<h1>404 Not Found</h1><p>Shortened URL not found.</p>');
    }

    // Check expiry date if set
    if (url.expiryDate && new Date(url.expiryDate) < new Date()) {
      return res.status(410).send('<h1>410 Gone</h1><p>This shortened URL has expired.</p>');
    }

    // Parse user agent info
    const uaString = req.headers['user-agent'] || '';
    const agent = useragent.parse(uaString);
    
    // Simple device categorization
    let device = 'Desktop';
    if (/mobile|iphone|ipod|android|blackberry|opera mini|windows phone/i.test(uaString)) {
      device = 'Mobile';
    } else if (/ipad|tablet/i.test(uaString)) {
      device = 'Tablet';
    }

    // Extract client IP address
    const clientIp = req.headers['x-forwarded-for'] || req.socket.remoteAddress || 'unknown';

    // Log the click analytics record
    const click = new Click({
      urlId: url._id,
      ip: clientIp,
      userAgent: uaString,
      browser: agent.family || 'unknown',
      os: agent.os.family || 'unknown',
      device
    });

    // Save click record and increment url clicks count in parallel
    await Promise.all([
      click.save(),
      Url.updateOne({ _id: url._id }, { $inc: { clicksCount: 1 } })
    ]);

    // Redirect to longUrl with 302 Found
    res.redirect(302, url.longUrl);
  } catch (error) {
    console.error('Redirect Controller Error:', error);
    res.status(500).send('<h1>500 Internal Server Error</h1>');
  }
});

export default router;
