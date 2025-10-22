import express from 'express';
import {
  followVendor,
  followProduct,
  addToWishlist,
  getWishlist,
} from '../services/followWishlist';

const router = express.Router();

// Endpoint to follow a vendor
router.post('/follow/vendor', async (req, res) => {
  const { userId, vendorId } = req.body;

  try {
    const result = await followVendor(userId, vendorId);
    res.status(201).json(result);
  } catch (error) {
    console.error('Error following vendor:', error);
    res.status(500).json({ error: 'Failed to follow vendor' });
  }
});

// Endpoint to follow a product
router.post('/follow/product', async (req, res) => {
  const { userId, productId } = req.body;

  try {
    const result = await followProduct(userId, productId);
    res.status(201).json(result);
  } catch (error) {
    console.error('Error following product:', error);
    res.status(500).json({ error: 'Failed to follow product' });
  }
});

// Endpoint to add a product to wishlist
router.post('/wishlist', async (req, res) => {
  const { userId, productId } = req.body;

  try {
    const result = await addToWishlist(userId, productId);
    res.status(201).json(result);
  } catch (error) {
    console.error('Error adding to wishlist:', error);
    res.status(500).json({ error: 'Failed to add to wishlist' });
  }
});

// Endpoint to get wishlist for a user
router.get('/wishlist/:userId', async (req, res) => {
  const { userId } = req.params;

  try {
    const result = await getWishlist(userId);
    res.status(200).json(result);
  } catch (error) {
    console.error('Error fetching wishlist:', error);
    res.status(500).json({ error: 'Failed to fetch wishlist' });
  }
});

export default router;
