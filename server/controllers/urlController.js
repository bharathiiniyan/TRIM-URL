import { nanoid } from 'nanoid';
import Url from '../models/Url.js';
import Click from '../models/Click.js';

// @desc    Create a new shortened URL
// @route   POST /api/urls
// @access  Private
export const createShortUrl = async (req, res) => {
  const { longUrl, customAlias, expiryDate } = req.body;
  const userId = req.user.userId;

  try {
    let shortCode;

    if (customAlias) {
      const aliasLower = customAlias.trim();
      
      // Check if alias is already used as shortCode or customAlias
      const existingUrl = await Url.findOne({
        $or: [
          { shortCode: aliasLower },
          { customAlias: aliasLower }
        ]
      });

      if (existingUrl) {
        return res.status(400).json({ error: 'Custom alias is already in use' });
      }
      shortCode = aliasLower;
    } else {
      // Generate unique short code and verify it does not collide
      let isUnique = false;
      while (!isUnique) {
        shortCode = nanoid(6);
        const codeExists = await Url.findOne({ shortCode });
        if (!codeExists) {
          isUnique = true;
        }
      }
    }

    const newUrl = new Url({
      userId,
      longUrl,
      shortCode,
      customAlias: customAlias ? customAlias.trim() : undefined,
      expiryDate: expiryDate ? new Date(expiryDate) : null
    });

    await newUrl.save();

    // Construct full short URL dynamically based on current server host
    const fullShortUrl = `${req.protocol}://${req.get('host')}/r/${shortCode}`;

    res.status(201).json({
      message: 'URL shortened successfully',
      url: {
        id: newUrl._id,
        longUrl: newUrl.longUrl,
        shortCode: newUrl.shortCode,
        customAlias: newUrl.customAlias,
        clicksCount: newUrl.clicksCount,
        expiryDate: newUrl.expiryDate,
        createdAt: newUrl.createdAt,
        shortUrl: fullShortUrl
      }
    });
  } catch (error) {
    console.error('Create URL Error:', error);
    res.status(500).json({ error: 'Server error during URL creation' });
  }
};

// @desc    Get all URLs for logged-in user
// @route   GET /api/urls
// @access  Private
export const getUserUrls = async (req, res) => {
  const userId = req.user.userId;

  try {
    const urls = await Url.find({ userId }).sort({ createdAt: -1 });
    
    // Format full short URLs dynamically
    const formattedUrls = urls.map(url => ({
      id: url._id,
      longUrl: url.longUrl,
      shortCode: url.shortCode,
      customAlias: url.customAlias,
      clicksCount: url.clicksCount,
      expiryDate: url.expiryDate,
      createdAt: url.createdAt,
      shortUrl: `${req.protocol}://${req.get('host')}/r/${url.shortCode}`
    }));

    res.json(formattedUrls);
  } catch (error) {
    console.error('Get User URLs Error:', error);
    res.status(500).json({ error: 'Server error retrieving URLs' });
  }
};

// @desc    Delete a shortened URL
// @route   DELETE /api/urls/:id
// @access  Private
export const deleteUrl = async (req, res) => {
  const { id } = req.params;
  const userId = req.user.userId;

  try {
    // Find URL and check owner
    const url = await Url.findOne({ _id: id, userId });
    if (!url) {
      return res.status(404).json({ error: 'URL not found or unauthorized' });
    }

    // Delete associated Click history
    await Click.deleteMany({ urlId: id });

    // Delete the URL itself
    await Url.deleteOne({ _id: id });

    res.json({ message: 'URL and its analytics logs successfully deleted' });
  } catch (error) {
    console.error('Delete URL Error:', error);
    res.status(500).json({ error: 'Server error during URL deletion' });
  }
};
