import mongoose from 'mongoose';
import Url from '../models/Url.js';
import Click from '../models/Click.js';

// @desc    Get detailed analytics for a shortened URL (authenticated owner)
// @route   GET /api/analytics/:urlId
// @access  Private
export const getUrlAnalytics = async (req, res) => {
  const { urlId } = req.params;
  const userId = req.user.userId;

  // Validate ObjectId
  if (!mongoose.Types.ObjectId.isValid(urlId)) {
    return res.status(400).json({ error: 'Invalid URL ID' });
  }

  try {
    // Check if the URL exists and belongs to the user
    const url = await Url.findOne({ _id: urlId, userId });
    if (!url) {
      return res.status(404).json({ error: 'URL not found or unauthorized' });
    }

    // 1. Get total clicks count from the URL document (fast)
    const totalClicks = url.clicksCount;

    // 2. Get the last visited click time
    const lastClick = await Click.findOne({ urlId }).sort({ timestamp: -1 });
    const lastVisited = lastClick ? lastClick.timestamp : null;

    // 3. Get the 10 most recent visits
    const recentVisits = await Click.find({ urlId })
      .sort({ timestamp: -1 })
      .limit(10)
      .select('timestamp ip browser os device');

    // 4. Daily click trend for the last 30 days
    const last30Days = new Date();
    last30Days.setDate(last30Days.getDate() - 30);

    const dailyTrendAgg = await Click.aggregate([
      {
        $match: {
          urlId: new mongoose.Types.ObjectId(urlId),
          timestamp: { $gte: last30Days }
        }
      },
      {
        $group: {
          _id: { $dateToString: { format: "%Y-%m-%d", date: "$timestamp" } },
          clicks: { $sum: 1 }
        }
      },
      {
        $sort: { _id: 1 }
      }
    ]);

    // Format daily trend to have all dates in the range, even with 0 clicks
    const dailyTrend = [];
    for (let i = 29; i >= 0; i--) {
      const date = new Date();
      date.setDate(date.getDate() - i);
      const dateStr = date.toISOString().slice(0, 10);
      
      const found = dailyTrendAgg.find(item => item._id === dateStr);
      dailyTrend.push({
        date: dateStr,
        clicks: found ? found.clicks : 0
      });
    }

    // 5. Browser distribution aggregation
    const browserDist = await Click.aggregate([
      { $match: { urlId: new mongoose.Types.ObjectId(urlId) } },
      { $group: { _id: '$browser', count: { $sum: 1 } } },
      { $sort: { count: -1 } }
    ]);

    // 6. Device distribution aggregation
    const deviceDist = await Click.aggregate([
      { $match: { urlId: new mongoose.Types.ObjectId(urlId) } },
      { $group: { _id: '$device', count: { $sum: 1 } } },
      { $sort: { count: -1 } }
    ]);

    // 7. OS distribution aggregation
    const osDist = await Click.aggregate([
      { $match: { urlId: new mongoose.Types.ObjectId(urlId) } },
      { $group: { _id: '$os', count: { $sum: 1 } } },
      { $sort: { count: -1 } }
    ]);

    res.json({
      totalClicks,
      lastVisited,
      recentVisits,
      dailyTrend,
      distributions: {
        browsers: browserDist.map(item => ({ name: item._id, value: item.count })),
        devices: deviceDist.map(item => ({ name: item._id, value: item.count })),
        os: osDist.map(item => ({ name: item._id, value: item.count }))
      }
    });
  } catch (error) {
    console.error('URL Analytics Error:', error);
    res.status(500).json({ error: 'Server error retrieving analytics' });
  }
};

// @desc    Get public stats for a short URL
// @route   GET /api/analytics/public/:shortCode
// @access  Public
export const getPublicStats = async (req, res) => {
  const { shortCode } = req.params;

  try {
    const url = await Url.findOne({ shortCode });
    if (!url) {
      return res.status(404).json({ error: 'Shortened URL not found' });
    }

    // Daily click trend for the last 30 days
    const last30Days = new Date();
    last30Days.setDate(last30Days.getDate() - 30);

    const dailyTrendAgg = await Click.aggregate([
      {
        $match: {
          urlId: url._id,
          timestamp: { $gte: last30Days }
        }
      },
      {
        $group: {
          _id: { $dateToString: { format: "%Y-%m-%d", date: "$timestamp" } },
          clicks: { $sum: 1 }
        }
      },
      {
        $sort: { _id: 1 }
      }
    ]);

    const dailyTrend = [];
    for (let i = 29; i >= 0; i--) {
      const date = new Date();
      date.setDate(date.getDate() - i);
      const dateStr = date.toISOString().slice(0, 10);
      
      const found = dailyTrendAgg.find(item => item._id === dateStr);
      dailyTrend.push({
        date: dateStr,
        clicks: found ? found.clicks : 0
      });
    }

    res.json({
      shortCode: url.shortCode,
      longUrl: url.longUrl.substring(0, 80) + (url.longUrl.length > 80 ? '...' : ''),
      clicksCount: url.clicksCount,
      createdAt: url.createdAt,
      expiryDate: url.expiryDate,
      dailyTrend
    });
  } catch (error) {
    console.error('Public Stats Error:', error);
    res.status(500).json({ error: 'Server error retrieving public statistics' });
  }
};
