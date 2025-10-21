// Basic collaborative filtering recommendation engine
import { Order } from '../models/Order';
import { Product } from '../models/Product';
import { PipelineStage } from 'mongoose';

// Recommend products based on past purchases/views (collaborative filtering)
export async function getUserRecommendations(userId: string, limit = 10) {
  // 1. Find products this user has purchased
  const userOrders = await Order.find({ user: userId }).lean();
  const userProductIds = new Set(userOrders.flatMap(o => o.items.map(i => (i.product || '').toString())));

  // 2. Find other users who bought the same products
  const otherOrders = await Order.find({ 'items.productId': { $in: Array.from(userProductIds) }, user: { $ne: userId } }).lean();
  const otherUserIds = Array.from(new Set(otherOrders.map(o => o.user.toString())));

  // 3. Find products those users bought (excluding already bought by this user)
  const recOrders = await Order.find({ user: { $in: otherUserIds } }).lean();
  const recProductIds = recOrders.flatMap(o => o.items.map(i => (i.product || '').toString()))
    .filter(pid => !userProductIds.has(pid));

  // 4. Count frequency and return top N
  const freq: Record<string, number> = {};
  for (const pid of recProductIds) freq[pid] = (freq[pid] || 0) + 1;
  const topProductIds = Object.entries(freq)
    .sort((a, b) => b[1] - a[1])
    .slice(0, limit)
    .map(([pid]) => pid);
  const products = await Product.find({ _id: { $in: topProductIds } }).lean();
  return products;
}

// Recommend products frequently bought together with a given product
export async function getFrequentlyBoughtTogether(productId: string, limit = 10) {
  // Find orders containing this product
  const orders = await Order.find({ 'items.productId': productId }).lean();
  // Collect other products bought in same orders
  const otherProductIds: string[] = [];
  for (const order of orders) {
    for (const item of order.items) {
  const pid = item.product.toString();
      if (pid !== productId) otherProductIds.push(pid);
    }
  }
  // Count frequency
  const freq: Record<string, number> = {};
  for (const pid of otherProductIds) freq[pid] = (freq[pid] || 0) + 1;
  const topProductIds = Object.entries(freq)
    .sort((a, b) => b[1] - a[1])
    .slice(0, limit)
    .map(([pid]) => pid);
  return await Product.find({ _id: { $in: topProductIds } }).lean();
}

// Customers also viewed (simple version: products viewed by users who viewed this one)
export async function getCustomersAlsoViewed(productId: string, limit = 10) {
  // Assume we have a View model (not shown) or use orders as proxy
  // Find users who bought/viewed this product
  const orders = await Order.find({ 'items.productId': productId }).lean();
  const userIds = Array.from(new Set(orders.map(o => o.user.toString())));
  // Find other products those users bought/viewed
  const otherOrders = await Order.find({ user: { $in: userIds } }).lean();
  const viewedProductIds: string[] = [];
  for (const order of otherOrders) {
    for (const item of order.items) {
  const pid = (item.product || '').toString();
      if (pid !== productId) viewedProductIds.push(pid);
    }
  }
  // Count frequency
  const freq: Record<string, number> = {};
  for (const pid of viewedProductIds) freq[pid] = (freq[pid] || 0) + 1;
  const topProductIds = Object.entries(freq)
    .sort((a, b) => b[1] - a[1])
    .slice(0, limit)
    .map(([pid]) => pid);
  return await Product.find({ _id: { $in: topProductIds } }).lean();
}

// Trending products by order count (platform-wide)
export async function getTrendingProducts(limit = 10) {
  const pipeline: PipelineStage[] = [
    { $unwind: '$items' },
  { $group: { _id: '$items.product', count: { $sum: 1 } } },
    { $sort: { count: -1 } },
    { $limit: limit },
    { $lookup: { from: 'products', localField: '_id', foreignField: '_id', as: 'product' } },
    { $unwind: '$product' },
    { $replaceRoot: { newRoot: '$product' } },
  ];
  return await Order.aggregate(pipeline);
}

// Trending products for a vendor
export async function getVendorTrendingProducts(vendorId: string, limit = 10) {
  const pipeline: PipelineStage[] = [
    { $unwind: '$items' },
    { $match: { 'items.vendorId': vendorId } },
  { $group: { _id: '$items.product', count: { $sum: 1 } } },
    { $sort: { count: -1 } },
    { $limit: limit },
    { $lookup: { from: 'products', localField: '_id', foreignField: '_id', as: 'product' } },
    { $unwind: '$product' },
    { $replaceRoot: { newRoot: '$product' } },
  ];
  return await Order.aggregate(pipeline);
}
