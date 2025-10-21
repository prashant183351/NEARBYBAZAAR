import express, { Request, Response } from 'express';
import { evaluateBids, BidRequest, BidResponse } from '../services/adExchange'; // Ensure the file '../services/adExchange.ts' exists and is correctly implemented.
import { handleTargetedAdRequest } from '../controllers/audienceTargeting';

const router = express.Router();

// Endpoint to handle ad impression opportunities
router.post('/ad/impression', async (req: Request, res: Response) => {
  try {
    const bidRequest: BidRequest = req.body;

    // Evaluate bids and select a winner
    const bidResponse: BidResponse = await evaluateBids(bidRequest);

    res.status(200).json(bidResponse);
  } catch (error) {
    console.error('Error handling ad impression:', error);
    res.status(500).json({ error: 'Failed to process ad impression' });
  }
});

// Endpoint to handle targeted ad requests
router.post('/ad/targeted', handleTargetedAdRequest);

export default router;