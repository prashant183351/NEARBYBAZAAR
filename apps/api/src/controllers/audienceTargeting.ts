import { Request, Response } from 'express';
import { BuyerSegment, TargetedAdRequest, TargetedAdResponse } from '../services/audienceTargeting';

// Mock database for buyer segments
const buyerSegments: BuyerSegment[] = [
  {
    id: '1',
    name: 'Frequent Electronics Shoppers',
    criteria: { category: 'electronics', purchaseFrequency: 'high' },
  },
  { id: '2', name: 'City: New York', criteria: { location: 'New York' } },
  { id: '3', name: 'Demographic: Age 25-34', criteria: { ageRange: [25, 34] } },
];

/**
 * Handle targeted ad requests.
 */
export const handleTargetedAdRequest = async (req: Request, res: Response) => {
  try {
    const adRequest: TargetedAdRequest = req.body;

    // Match buyer segments
    const matchedSegments = buyerSegments.filter((segment) => {
      return Object.entries(segment.criteria).every(([key, value]) => {
        if (key === 'ageRange') {
          const [minAge, maxAge] = value as [number, number];
          return adRequest.buyerProfile.age >= minAge && adRequest.buyerProfile.age <= maxAge;
        }
        // Only allow keys that exist in buyerProfile
        if (key in adRequest.buyerProfile) {
          return (adRequest.buyerProfile as Record<string, unknown>)[key] === value;
        }
        return false;
      });
    });

    // Respond with targeted ads
    const response: TargetedAdResponse = {
      buyerId: adRequest.buyerId,
      matchedSegments,
      ads: matchedSegments.map((segment) => ({
        segmentId: segment.id,
        adContent: `Ad for ${segment.name}`,
      })),
    };

    res.status(200).json(response);
  } catch (error) {
    console.error('Error handling targeted ad request:', error);
    res.status(500).json({ error: 'Failed to process targeted ad request' });
  }
};
