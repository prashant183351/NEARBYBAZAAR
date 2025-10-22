import { Request, Response } from 'express';
import { AdCampaign } from '../models/AdCampaign';
import { validateCampaign, estimateCampaignPerformance } from '../services/adAuction';
import { getCampaignAnalytics } from '../services/adTracking';

// Extend Request to include user (added by auth middleware)
interface AuthRequest extends Request {
  user?: {
    id: string;
    email: string;
    role: 'user' | 'vendor' | 'admin';
    vendorId?: string;
    scopes?: string[];
  };
}

/**
 * Get all campaigns for the authenticated vendor
 */
export async function getVendorCampaigns(req: AuthRequest, res: Response): Promise<void> {
  try {
    const vendorId = req.user?.vendorId;
    if (!vendorId) {
      res.status(403).json({ error: 'Vendor access required' });
      return;
    }

    const { status, limit = 20, skip = 0 } = req.query;

    const query: any = { vendor: vendorId };
    if (status) {
      query.status = status;
    }

    const campaigns = await AdCampaign.find(query)
      .populate('product', 'name slug images')
      .sort({ createdAt: -1 })
      .limit(Number(limit))
      .skip(Number(skip));

    const total = await AdCampaign.countDocuments(query);

    res.json({
      campaigns,
      total,
      limit: Number(limit),
      skip: Number(skip),
    });
  } catch (error) {
    console.error('Error fetching vendor campaigns:', error);
    res.status(500).json({ error: 'Failed to fetch campaigns' });
  }
}

/**
 * Get single campaign details
 */
export async function getCampaignById(req: AuthRequest, res: Response): Promise<void> {
  try {
    const { id } = req.params;
    const vendorId = req.user?.vendorId;

    const campaign = await AdCampaign.findById(id)
      .populate('product', 'name slug images price')
      .populate('vendor', 'name email');

    if (!campaign) {
      res.status(404).json({ error: 'Campaign not found' });
      return;
    }

    // Check if user has access (vendor owns campaign or admin)
    if (req.user?.role !== 'admin' && campaign.vendor._id.toString() !== vendorId) {
      res.status(403).json({ error: 'Access denied' });
      return;
    }

    res.json(campaign);
  } catch (error) {
    console.error('Error fetching campaign:', error);
    res.status(500).json({ error: 'Failed to fetch campaign' });
  }
}

/**
 * Create new campaign
 */
export async function createCampaign(req: AuthRequest, res: Response): Promise<void> {
  try {
    const vendorId = req.user?.vendorId;
    if (!vendorId) {
      res.status(403).json({ error: 'Vendor access required' });
      return;
    }

    const campaignData = {
      ...req.body,
      vendor: vendorId,
    };

    // Validate campaign data
    const errors = validateCampaign(campaignData);
    if (errors.length > 0) {
      res.status(400).json({ errors });
      return;
    }

    // TODO: Check vendor wallet balance
    // const vendor = await Vendor.findById(vendorId);
    // if (vendor.walletBalance < campaignData.totalBudget) {
    //   return res.status(400).json({ error: 'Insufficient wallet balance' });
    // }

    const campaign = new AdCampaign(campaignData);
    await campaign.save();

    await campaign.populate('product', 'name slug images');

    res.status(201).json(campaign);
  } catch (error) {
    console.error('Error creating campaign:', error);
    res.status(500).json({ error: 'Failed to create campaign' });
  }
}

/**
 * Update campaign
 */
export async function updateCampaign(req: AuthRequest, res: Response): Promise<void> {
  try {
    const { id } = req.params;
    const vendorId = req.user?.vendorId;

    const campaign = await AdCampaign.findById(id);
    if (!campaign) {
      res.status(404).json({ error: 'Campaign not found' });
      return;
    }

    // Check ownership
    if (campaign.vendor.toString() !== vendorId && req.user?.role !== 'admin') {
      res.status(403).json({ error: 'Access denied' });
      return;
    }

    // Validate updates
    const errors = validateCampaign(req.body);
    if (errors.length > 0) {
      res.status(400).json({ errors });
      return;
    }

    // Some fields can't be changed after campaign is active
    if (campaign.status !== 'draft') {
      const immutableFields = ['bidType', 'vendor', 'product'];
      immutableFields.forEach((field) => {
        if (req.body[field] !== undefined) {
          delete req.body[field];
        }
      });
    }

    Object.assign(campaign, req.body);
    await campaign.save();

    await campaign.populate('product', 'name slug images');

    res.json(campaign);
  } catch (error) {
    console.error('Error updating campaign:', error);
    res.status(500).json({ error: 'Failed to update campaign' });
  }
}

/**
 * Pause campaign
 */
export async function pauseCampaign(req: AuthRequest, res: Response): Promise<void> {
  try {
    const { id } = req.params;
    const vendorId = req.user?.vendorId;

    const campaign = await AdCampaign.findById(id);
    if (!campaign) {
      res.status(404).json({ error: 'Campaign not found' });
      return;
    }

    if (campaign.vendor.toString() !== vendorId && req.user?.role !== 'admin') {
      res.status(403).json({ error: 'Access denied' });
      return;
    }

    if (campaign.status !== 'active') {
      res.status(400).json({ error: 'Only active campaigns can be paused' });
      return;
    }

    campaign.status = 'paused';
    await campaign.save();

    res.json({ message: 'Campaign paused successfully', campaign });
  } catch (error) {
    console.error('Error pausing campaign:', error);
    res.status(500).json({ error: 'Failed to pause campaign' });
  }
}

/**
 * Resume campaign
 */
export async function resumeCampaign(req: AuthRequest, res: Response): Promise<void> {
  try {
    const { id } = req.params;
    const vendorId = req.user?.vendorId;

    const campaign = await AdCampaign.findById(id);
    if (!campaign) {
      res.status(404).json({ error: 'Campaign not found' });
      return;
    }

    if (campaign.vendor.toString() !== vendorId && req.user?.role !== 'admin') {
      res.status(403).json({ error: 'Access denied' });
      return;
    }

    if (campaign.status !== 'paused') {
      res.status(400).json({ error: 'Only paused campaigns can be resumed' });
      return;
    }

    // Check if campaign can still run
    if (!campaign.canServe()) {
      res.status(400).json({
        error: 'Campaign cannot be resumed (budget exhausted or ended)',
      });
      return;
    }

    campaign.status = 'active';
    await campaign.save();

    res.json({ message: 'Campaign resumed successfully', campaign });
  } catch (error) {
    console.error('Error resuming campaign:', error);
    res.status(500).json({ error: 'Failed to resume campaign' });
  }
}

/**
 * Delete campaign (only drafts can be deleted)
 */
export async function deleteCampaign(req: AuthRequest, res: Response): Promise<void> {
  try {
    const { id } = req.params;
    const vendorId = req.user?.vendorId;

    const campaign = await AdCampaign.findById(id);
    if (!campaign) {
      res.status(404).json({ error: 'Campaign not found' });
      return;
    }

    if (campaign.vendor.toString() !== vendorId && req.user?.role !== 'admin') {
      res.status(403).json({ error: 'Access denied' });
      return;
    }

    if (campaign.status !== 'draft') {
      res.status(400).json({
        error: 'Only draft campaigns can be deleted. Active campaigns should be paused.',
      });
      return;
    }

    await campaign.deleteOne();

    res.json({ message: 'Campaign deleted successfully' });
  } catch (error) {
    console.error('Error deleting campaign:', error);
    res.status(500).json({ error: 'Failed to delete campaign' });
  }
}

/**
 * Get campaign analytics
 */
export async function getCampaignStats(req: AuthRequest, res: Response): Promise<void> {
  try {
    const { id } = req.params;
    const vendorId = req.user?.vendorId;
    const { startDate, endDate } = req.query;

    const campaign = await AdCampaign.findById(id);
    if (!campaign) {
      res.status(404).json({ error: 'Campaign not found' });
      return;
    }

    if (campaign.vendor.toString() !== vendorId && req.user?.role !== 'admin') {
      res.status(403).json({ error: 'Access denied' });
      return;
    }

    const start = startDate ? new Date(startDate as string) : undefined;
    const end = endDate ? new Date(endDate as string) : undefined;

    const analytics = await getCampaignAnalytics(id, start, end);

    res.json({
      campaign: {
        id: campaign._id,
        name: campaign.name,
        status: campaign.status,
        bidType: campaign.bidType,
        bidAmount: campaign.bidAmount,
      },
      ...analytics,
    });
  } catch (error) {
    console.error('Error fetching campaign stats:', error);
    res.status(500).json({ error: 'Failed to fetch campaign stats' });
  }
}

/**
 * Estimate campaign performance
 */
export async function estimateCampaign(req: Request, res: Response): Promise<void> {
  try {
    const { keywords, placement, bidAmount, bidType, dailyBudget } = req.body;

    if (!keywords || !placement || !bidAmount || !bidType || !dailyBudget) {
      res.status(400).json({
        error: 'Missing required fields: keywords, placement, bidAmount, bidType, dailyBudget',
      });
      return;
    }

    const estimate = await estimateCampaignPerformance(
      keywords,
      placement,
      Number(bidAmount),
      bidType,
      Number(dailyBudget),
    );

    res.json(estimate);
  } catch (error) {
    console.error('Error estimating campaign:', error);
    res.status(500).json({ error: 'Failed to estimate campaign performance' });
  }
}
