import { Schema, model } from 'mongoose';
import { sendEmail } from './email'; // Assuming email service exists

// Define a schema for tracking product views
const ProductViewSchema = new Schema({
  userId: { type: String, required: true },
  productId: { type: String, required: true },
  viewedAt: { type: Date, default: Date.now },
});

const ProductView = model('ProductView', ProductViewSchema);

// Function to log a product view
export const logProductView = async (userId: string, productId: string) => {
  await ProductView.create({ userId, productId });
};

// Function to get retargeting list
export const getRetargetingList = async (days: number) => {
  const cutoffDate = new Date();
  cutoffDate.setDate(cutoffDate.getDate() - days);

  return ProductView.aggregate([
    { $match: { viewedAt: { $gte: cutoffDate } } },
    { $group: { _id: '$productId', viewers: { $addToSet: '$userId' } } },
  ]);
};

// Function to send retargeting emails
export const sendRetargetingEmails = async (days: number) => {
  const retargetingList = await getRetargetingList(days);

  for (const item of retargetingList) {
    const productId = item._id;
    const userIds = item.viewers;

    for (const userId of userIds) {
      await sendEmail(userId, `Still interested in product ${productId}?`, 'Check it out again!');
    }
  }
};