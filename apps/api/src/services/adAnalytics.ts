import { Schema, model } from 'mongoose';

// Define a schema for ad analytics
const AdAnalyticsSchema = new Schema({
  adId: { type: String, required: true },
  vendorId: { type: String, required: true },
  clicks: { type: Number, default: 0 },
  impressions: { type: Number, default: 0 },
  orders: { type: Number, default: 0 },
  revenue: { type: Number, default: 0 },
  createdAt: { type: Date, default: Date.now },
});

const AdAnalytics = model('AdAnalytics', AdAnalyticsSchema);

// Function to log an impression
export const logImpression = async (adId: string, vendorId: string) => {
  await AdAnalytics.findOneAndUpdate(
    { adId, vendorId },
    { $inc: { impressions: 1 } },
    { upsert: true, new: true },
  );
};

// Function to log a click
export const logClick = async (adId: string, vendorId: string) => {
  await AdAnalytics.findOneAndUpdate(
    { adId, vendorId },
    { $inc: { clicks: 1 } },
    { upsert: true, new: true },
  );
};

// Function to log an order and revenue
export const logOrder = async (adId: string, vendorId: string, revenue: number) => {
  await AdAnalytics.findOneAndUpdate(
    { adId, vendorId },
    { $inc: { orders: 1, revenue } },
    { upsert: true, new: true },
  );
};

// Function to fetch analytics for a vendor
export const getVendorAnalytics = async (vendorId: string) => {
  return AdAnalytics.find({ vendorId });
};

// Function to fetch overall analytics for admin
export const getAdminAnalytics = async () => {
  return AdAnalytics.aggregate([
    {
      $group: {
        _id: null,
        totalClicks: { $sum: '$clicks' },
        totalImpressions: { $sum: '$impressions' },
        totalOrders: { $sum: '$orders' },
        totalRevenue: { $sum: '$revenue' },
      },
    },
  ]);
};
