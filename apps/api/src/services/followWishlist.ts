import { Schema, model } from 'mongoose';

// Define schema for following vendors and products
const FollowSchema = new Schema({
  userId: { type: String, required: true },
  vendorId: { type: String },
  productId: { type: String },
  createdAt: { type: Date, default: Date.now },
});

const Follow = model('Follow', FollowSchema);

// Define schema for wishlist
const WishlistSchema = new Schema({
  userId: { type: String, required: true },
  productId: { type: String, required: true },
  createdAt: { type: Date, default: Date.now },
});

const Wishlist = model('Wishlist', WishlistSchema);

// Function to follow a vendor
export const followVendor = async (userId: string, vendorId: string) => {
  const follow = new Follow({ userId, vendorId });
  return follow.save();
};

// Function to follow a product
export const followProduct = async (userId: string, productId: string) => {
  const follow = new Follow({ userId, productId });
  return follow.save();
};

// Function to add a product to wishlist
export const addToWishlist = async (userId: string, productId: string) => {
  const wishlistItem = new Wishlist({ userId, productId });
  return wishlistItem.save();
};

// Function to get wishlist for a user
export const getWishlist = async (userId: string) => {
  return Wishlist.find({ userId });
};

// Function to notify followers
export const notifyFollowers = async (message: string, userIds: string[]) => {
  // Placeholder for notification logic (email, push, in-app feed)
  console.log(`Notifying users: ${userIds.join(', ')} with message: ${message}`);
};
