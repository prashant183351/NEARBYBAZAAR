import { Schema, model } from 'mongoose';

// Define a schema for video ads
const VideoAdSchema = new Schema({
  vendorId: { type: String, required: true },
  videoUrl: { type: String, required: true },
  productId: { type: String, required: false }, // Optional: Link to a product
  createdAt: { type: Date, default: Date.now },
});

const VideoAd = model('VideoAd', VideoAdSchema);

// Function to create a video ad
export const createVideoAd = async (vendorId: string, videoUrl: string, productId?: string) => {
  return VideoAd.create({ vendorId, videoUrl, productId });
};

// Function to fetch video ads for a vendor
export const getVideoAdsByVendor = async (vendorId: string) => {
  return VideoAd.find({ vendorId });
};

// Function to fetch all video ads
export const getAllVideoAds = async () => {
  return VideoAd.find();
};