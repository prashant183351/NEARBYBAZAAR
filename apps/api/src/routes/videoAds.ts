import express from 'express';
import { createVideoAd, getVideoAdsByVendor, getAllVideoAds } from '../services/videoAds';

const router = express.Router();

// Endpoint to create a video ad
router.post('/video-ads', async (req, res) => {
  const { vendorId, videoUrl, productId } = req.body;

  if (!vendorId || !videoUrl) {
    return res.status(400).json({ error: 'Missing required fields: vendorId, videoUrl' });
  }

  try {
    const videoAd = await createVideoAd(vendorId, videoUrl, productId);
    res.status(201).json(videoAd);
  } catch (error) {
    console.error('Error creating video ad:', error);
    res.status(500).json({ error: 'Failed to create video ad' });
  }
});

// Endpoint to fetch video ads by vendor
router.get('/video-ads/vendor/:vendorId', async (req, res) => {
  const { vendorId } = req.params;

  try {
    const videoAds = await getVideoAdsByVendor(vendorId);
    res.status(200).json(videoAds);
  } catch (error) {
    console.error('Error fetching video ads:', error);
    res.status(500).json({ error: 'Failed to fetch video ads' });
  }
});

// Endpoint to fetch all video ads
router.get('/video-ads', async (_req, res) => {
  try {
    const videoAds = await getAllVideoAds();
    res.status(200).json(videoAds);
  } catch (error) {
    console.error('Error fetching all video ads:', error);
    res.status(500).json({ error: 'Failed to fetch video ads' });
  }
});

export default router;
