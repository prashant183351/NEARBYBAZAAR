// Courier Bidding System: fetch quotes from all adapters and select best
import { ShiprocketAdapter } from './shiprocket';
// import { DelhiveryAdapter } from './delhivery'; // Add more as implemented
import { logger } from '../../utils/logger';

export interface BiddingRequest {
  origin: { pincode: string; country: string; city?: string };
  destination: { pincode: string; country: string; city?: string };
  weight: number; // in kg
  dimensions?: { length: number; width: number; height: number };
  value?: number;
  orderId?: string;
}

export interface CourierQuote {
  courier: string;
  cost: number;
  estimatedDeliveryDays: number;
  serviceLevel?: string;
  raw?: any;
}

export async function getCourierQuotes(req: BiddingRequest): Promise<CourierQuote[]> {
  const adapters = [
    new ShiprocketAdapter(),
    // new DelhiveryAdapter(),
    // ...add more adapters here
  ];
  const results: CourierQuote[] = [];
  for (const adapter of adapters) {
    try {
      if (typeof adapter.rateQuote !== 'function') continue;
      const quoteList = await adapter.rateQuote({
        origin: { pincode: req.origin.pincode, country: req.origin.country },
        destination: { pincode: req.destination.pincode, country: req.destination.country },
        parcel: {
          weight: req.weight,
          length: req.dimensions?.length,
          breadth: req.dimensions?.width,
          height: req.dimensions?.height,
          declaredValue: req.value,
        },
      });
      for (const quote of quoteList) {
        if (quote && quote.rate > 0) {
          results.push({
            courier: quote.courier,
            cost: quote.rate,
            estimatedDeliveryDays: quote.estimatedDays || 0,
            serviceLevel: quote.serviceType,
            raw: quote,
          });
        }
      }
    } catch (err) {
      logger.warn(`[Bidding] Adapter ${adapter.name} failed:`, err);
    }
  }
  return results.sort((a, b) => a.cost - b.cost); // sort by cost ascending
}

export function selectBestCourier(
  quotes: CourierQuote[],
  criteria: 'cost' | 'speed' = 'cost',
): CourierQuote | null {
  if (!quotes.length) return null;
  if (criteria === 'speed') {
    return quotes.reduce(
      (best, q) => (q.estimatedDeliveryDays < best.estimatedDeliveryDays ? q : best),
      quotes[0],
    );
  }
  // Default: lowest cost
  return quotes[0];
}
