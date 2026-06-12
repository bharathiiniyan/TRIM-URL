import express from 'express';
import rateLimit from 'express-rate-limit';
import Url from '../models/Url.js';
import Click from '../models/Click.js';
import useragent from 'useragent';
import geoip from 'geoip-lite';

const COUNTRY_MAP = {
  'US': 'United States',
  'IN': 'India',
  'GB': 'United Kingdom',
  'DE': 'Germany',
  'FR': 'France',
  'CA': 'Canada',
  'AU': 'Australia',
  'BR': 'Brazil',
  'JP': 'Japan',
  'CN': 'China',
  'RU': 'Russia',
  'ZA': 'South Africa',
  'MX': 'Mexico',
  'IT': 'Italy',
  'ES': 'Spain',
  'NL': 'Netherlands',
  'SG': 'Singapore',
  'AE': 'United Arab Emirates',
  'NZ': 'New Zealand',
  'CH': 'Switzerland',
  'SE': 'Sweden',
  'NO': 'Norway',
  'DK': 'Denmark',
  'FI': 'Finland',
  'IE': 'Ireland',
  'BE': 'Belgium',
  'AT': 'Austria',
  'PT': 'Portugal',
  'KR': 'South Korea',
  'HK': 'Hong Kong'
};

function getCountryName(code) {
  return COUNTRY_MAP[code] || code;
}


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

    // Extract client IP address (supporting sim_ip query param for local dev testing)
    let clientIp = req.query.sim_ip || req.headers['x-forwarded-for'] || req.socket.remoteAddress || 'unknown';

    // Parse the client IP if it contains a list of proxies (Client, Proxy1, Proxy2)
    if (clientIp.includes(',')) {
      clientIp = clientIp.split(',')[0].trim();
    }
    // Clean up IPv6 mapped IPv4 address
    if (clientIp.startsWith('::ffff:')) {
      clientIp = clientIp.substring(7);
    }

    // Geolocation lookup
    let country = 'Unknown';
    let countryCode = 'Unknown';
    let city = 'Unknown';

    if (clientIp && clientIp !== '127.0.0.1' && clientIp !== '::1' && clientIp !== 'unknown') {
      const geo = geoip.lookup(clientIp);
      if (geo) {
        countryCode = geo.country || 'Unknown';
        country = getCountryName(countryCode);
        city = geo.city || 'Unknown';
      }
    } else {
      country = 'Local / Test';
      countryCode = 'LCL';
      city = 'Localhost';
    }

    // Log the click analytics record
    const click = new Click({
      urlId: url._id,
      ip: clientIp,
      userAgent: uaString,
      browser: agent.family || 'unknown',
      os: agent.os.family || 'unknown',
      device,
      country,
      countryCode,
      city
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
