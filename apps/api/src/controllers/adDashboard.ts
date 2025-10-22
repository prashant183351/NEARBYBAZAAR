/**
 * Ad Dashboard Controller
 * Provides aggregated data for vendor and admin ad dashboards
 */

import { Request, Response, NextFunction } from 'express';
import { AdCampaign } from '../models/AdCampaign';
import { AdClick } from '../models/AdClick';
import { Types } from 'mongoose';

// Extend Request to include user
interface AuthRequest extends Request {
  user?: {
    id: string;
    email: string;
    role: 'vendor' | 'user' | 'admin';
    vendorId?: string;
    scopes?: string[];
  };
}

/**
 * Get vendor dashboard summary
 * GET /v1/ad-dashboard/vendor/summary
 */
export async function getVendorDashboardSummary(
  req: AuthRequest,
  res: Response,
  next: NextFunction,
) {
  try {
    const vendorId = req.user?.vendorId || (req.query.vendorId as string);

    if (!vendorId) {
      return res.status(400).json({
        success: false,
        message: 'Vendor ID required',
      });
    }

    // Date range for stats (default: last 30 days)
    const daysBack = parseInt(req.query.daysBack as string) || 30;
    const startDate = new Date();
    startDate.setDate(startDate.getDate() - daysBack);

    // Get all campaigns for vendor
    const campaigns = await AdCampaign.find({ vendor: vendorId })
      .populate('product', 'name slug images')
      .lean();

    // Calculate summary metrics
    const summary = {
      totalCampaigns: campaigns.length,
      activeCampaigns: campaigns.filter((c) => c.status === 'active').length,
      pausedCampaigns: campaigns.filter((c) => c.status === 'paused').length,
      draftCampaigns: campaigns.filter((c) => c.status === 'draft').length,
      totalImpressions: campaigns.reduce((sum, c) => sum + c.impressions, 0),
      totalClicks: campaigns.reduce((sum, c) => sum + c.clicks, 0),
      totalSpent: campaigns.reduce((sum, c) => sum + c.spentTotal, 0),
      averageCTR: 0,
      averageCPC: 0,
    };

    // Calculate averages
    if (summary.totalImpressions > 0) {
      summary.averageCTR = (summary.totalClicks / summary.totalImpressions) * 100;
    }
    if (summary.totalClicks > 0) {
      summary.averageCPC = summary.totalSpent / summary.totalClicks;
    }

    // Get performance over time (daily breakdown)
    const dailyStats = await AdClick.aggregate([
      {
        $match: {
          vendor: new Types.ObjectId(vendorId),
          clickedAt: { $gte: startDate },
        },
      },
      {
        $group: {
          _id: {
            $dateToString: { format: '%Y-%m-%d', date: '$clickedAt' },
          },
          clicks: { $sum: 1 },
          cost: { $sum: '$cost' },
          conversions: {
            $sum: { $cond: ['$convertedToOrder', 1, 0] },
          },
        },
      },
      { $sort: { _id: 1 } },
    ]);

    // Get top performing campaigns
    const topCampaigns = campaigns
      .filter((c) => c.impressions > 0)
      .sort((a, b) => {
        const ctrA = a.clicks / a.impressions;
        const ctrB = b.clicks / b.impressions;
        return ctrB - ctrA;
      })
      .slice(0, 5)
      .map((c) => ({
        id: c._id,
        name: c.name,
        product: c.product,
        status: c.status,
        impressions: c.impressions,
        clicks: c.clicks,
        ctr: ((c.clicks / c.impressions) * 100).toFixed(2),
        spent: c.spentTotal.toFixed(2),
        avgCpc: c.avgCpc.toFixed(2),
      }));

    // Budget analysis
    const budgetAnalysis = {
      totalBudget: campaigns.reduce((sum, c) => sum + c.totalBudget, 0),
      totalSpent: summary.totalSpent,
      remainingBudget: campaigns.reduce((sum, c) => sum + (c.totalBudget - c.spentTotal), 0),
      dailyBudgetTotal: campaigns
        .filter((c) => c.status === 'active')
        .reduce((sum, c) => sum + c.dailyBudget, 0),
      dailySpentToday: campaigns.reduce((sum, c) => sum + c.spentToday, 0),
    };

    return res.json({
      success: true,
      data: {
        summary,
        dailyStats,
        topCampaigns,
        budgetAnalysis,
        campaigns: campaigns.map((c) => ({
          id: c._id,
          name: c.name,
          product: c.product,
          status: c.status,
          bidType: c.bidType,
          bidAmount: c.bidAmount,
          impressions: c.impressions,
          clicks: c.clicks,
          ctr: c.ctr,
          avgCpc: c.avgCpc,
          spentTotal: c.spentTotal,
          totalBudget: c.totalBudget,
          startDate: c.startDate,
          endDate: c.endDate,
        })),
      },
    });
  } catch (error) {
    next(error);
  }
}

/**
 * Get admin dashboard overview
 * GET /v1/ad-dashboard/admin/overview
 */
export async function getAdminDashboardOverview(
  req: AuthRequest,
  res: Response,
  next: NextFunction,
) {
  try {
    // Verify admin role
    if (req.user?.role !== 'admin') {
      return res.status(403).json({
        success: false,
        message: 'Admin access required',
      });
    }

    // Date range for stats (default: last 30 days)
    const daysBack = parseInt(req.query.daysBack as string) || 30;
    const startDate = new Date();
    startDate.setDate(startDate.getDate() - daysBack);

    // Platform-wide metrics
    const totalCampaigns = await AdCampaign.countDocuments();
    const activeCampaigns = await AdCampaign.countDocuments({ status: 'active' });

    // Revenue metrics
    const revenueData = await AdCampaign.aggregate([
      {
        $group: {
          _id: null,
          totalRevenue: { $sum: '$spentTotal' },
          totalImpressions: { $sum: '$impressions' },
          totalClicks: { $sum: '$clicks' },
        },
      },
    ]);

    const revenue = revenueData[0] || {
      totalRevenue: 0,
      totalImpressions: 0,
      totalClicks: 0,
    };

    // Daily revenue breakdown
    const dailyRevenue = await AdClick.aggregate([
      {
        $match: {
          clickedAt: { $gte: startDate },
        },
      },
      {
        $group: {
          _id: {
            $dateToString: { format: '%Y-%m-%d', date: '$clickedAt' },
          },
          revenue: { $sum: '$cost' },
          clicks: { $sum: 1 },
          conversions: {
            $sum: { $cond: ['$convertedToOrder', 1, 0] },
          },
        },
      },
      { $sort: { _id: 1 } },
    ]);

    // Top spending vendors
    const topVendors = await AdCampaign.aggregate([
      {
        $group: {
          _id: '$vendor',
          totalSpent: { $sum: '$spentTotal' },
          campaignCount: { $sum: 1 },
          totalImpressions: { $sum: '$impressions' },
          totalClicks: { $sum: '$clicks' },
        },
      },
      { $sort: { totalSpent: -1 } },
      { $limit: 10 },
      {
        $lookup: {
          from: 'vendors',
          localField: '_id',
          foreignField: '_id',
          as: 'vendorInfo',
        },
      },
      { $unwind: '$vendorInfo' },
      {
        $project: {
          vendorId: '$_id',
          vendorName: '$vendorInfo.businessName',
          totalSpent: 1,
          campaignCount: 1,
          totalImpressions: 1,
          totalClicks: 1,
          ctr: {
            $cond: [
              { $gt: ['$totalImpressions', 0] },
              {
                $multiply: [{ $divide: ['$totalClicks', '$totalImpressions'] }, 100],
              },
              0,
            ],
          },
        },
      },
    ]);

    // Campaign performance by placement
    const placementStats = await AdClick.aggregate([
      {
        $match: {
          clickedAt: { $gte: startDate },
        },
      },
      {
        $group: {
          _id: '$placement',
          clicks: { $sum: 1 },
          revenue: { $sum: '$cost' },
          conversions: {
            $sum: { $cond: ['$convertedToOrder', 1, 0] },
          },
        },
      },
      {
        $project: {
          placement: '$_id',
          clicks: 1,
          revenue: 1,
          conversions: 1,
          conversionRate: {
            $cond: [
              { $gt: ['$clicks', 0] },
              {
                $multiply: [{ $divide: ['$conversions', '$clicks'] }, 100],
              },
              0,
            ],
          },
        },
      },
    ]);

    // Fraud detection alerts
    const suspiciousCampaigns = await AdCampaign.find({
      status: 'active',
      $expr: {
        $and: [
          { $gt: ['$clicks', 100] }, // At least 100 clicks
          { $lt: ['$ctr', 0.5] }, // CTR below 0.5%
        ],
      },
    })
      .populate('vendor', 'businessName email')
      .populate('product', 'name slug')
      .limit(10)
      .lean();

    // High spend alerts (campaigns spending >80% budget)
    const highSpendCampaigns = await AdCampaign.find({
      status: 'active',
      $expr: {
        $gte: ['$spentTotal', { $multiply: ['$totalBudget', 0.8] }],
      },
    })
      .populate('vendor', 'businessName email')
      .populate('product', 'name slug')
      .limit(10)
      .lean();

    // Overall platform metrics
    const platformMetrics = {
      totalCampaigns,
      activeCampaigns,
      totalRevenue: revenue.totalRevenue,
      totalImpressions: revenue.totalImpressions,
      totalClicks: revenue.totalClicks,
      overallCTR:
        revenue.totalImpressions > 0
          ? ((revenue.totalClicks / revenue.totalImpressions) * 100).toFixed(2)
          : '0.00',
      averageRevenuePerClick:
        revenue.totalClicks > 0 ? (revenue.totalRevenue / revenue.totalClicks).toFixed(2) : '0.00',
    };

    return res.json({
      success: true,
      data: {
        platformMetrics,
        dailyRevenue,
        topVendors,
        placementStats,
        alerts: {
          suspiciousCampaigns: suspiciousCampaigns.map((c) => ({
            id: c._id,
            name: c.name,
            vendor: c.vendor,
            product: c.product,
            impressions: c.impressions,
            clicks: c.clicks,
            ctr: c.ctr,
            reason: 'Low CTR with high click volume',
          })),
          highSpendCampaigns: highSpendCampaigns.map((c) => ({
            id: c._id,
            name: c.name,
            vendor: c.vendor,
            product: c.product,
            spentTotal: c.spentTotal,
            totalBudget: c.totalBudget,
            percentSpent: ((c.spentTotal / c.totalBudget) * 100).toFixed(1),
          })),
        },
      },
    });
  } catch (error) {
    next(error);
  }
}

/**
 * Get campaign performance comparison
 * GET /v1/ad-dashboard/vendor/comparison
 */
export async function getCampaignComparison(req: AuthRequest, res: Response, next: NextFunction) {
  try {
    const vendorId = req.user?.vendorId || (req.query.vendorId as string);
    const campaignIds = req.query.campaigns as string;

    if (!vendorId || !campaignIds) {
      return res.status(400).json({
        success: false,
        message: 'Vendor ID and campaign IDs required',
      });
    }

    const ids = campaignIds.split(',').map((id) => new Types.ObjectId(id));

    // Get campaigns
    const campaigns = await AdCampaign.find({
      _id: { $in: ids },
      vendor: vendorId,
    })
      .populate('product', 'name slug images')
      .lean();

    if (campaigns.length === 0) {
      return res.status(404).json({
        success: false,
        message: 'No campaigns found',
      });
    }

    // Get click data for comparison
    const clickData = await AdClick.aggregate([
      {
        $match: {
          campaign: { $in: ids },
        },
      },
      {
        $group: {
          _id: {
            campaign: '$campaign',
            date: {
              $dateToString: { format: '%Y-%m-%d', date: '$clickedAt' },
            },
          },
          clicks: { $sum: 1 },
          cost: { $sum: '$cost' },
          conversions: {
            $sum: { $cond: ['$convertedToOrder', 1, 0] },
          },
        },
      },
      { $sort: { '_id.date': 1 } },
    ]);

    // Format comparison data
    const comparison = campaigns.map((campaign) => {
      const campaignClicks = clickData.filter(
        (d) => d._id.campaign.toString() === campaign._id.toString(),
      );

      return {
        id: campaign._id,
        name: campaign.name,
        product: campaign.product,
        status: campaign.status,
        bidType: campaign.bidType,
        bidAmount: campaign.bidAmount,
        metrics: {
          impressions: campaign.impressions,
          clicks: campaign.clicks,
          ctr: campaign.ctr,
          avgCpc: campaign.avgCpc,
          spentTotal: campaign.spentTotal,
          conversions: campaignClicks.reduce((sum, d) => sum + d.conversions, 0),
          conversionRate:
            campaign.clicks > 0
              ? (
                  (campaignClicks.reduce((sum, d) => sum + d.conversions, 0) / campaign.clicks) *
                  100
                ).toFixed(2)
              : '0.00',
        },
        timeline: campaignClicks.map((d) => ({
          date: d._id.date,
          clicks: d.clicks,
          cost: d.cost,
          conversions: d.conversions,
        })),
      };
    });

    return res.json({
      success: true,
      data: {
        campaigns: comparison,
      },
    });
  } catch (error) {
    next(error);
  }
}
