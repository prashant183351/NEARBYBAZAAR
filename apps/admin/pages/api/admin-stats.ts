import type { NextApiRequest, NextApiResponse } from 'next';

// This would call real DB/services in production
export default async function handler(_req: NextApiRequest, res: NextApiResponse) {
  // Simulated stats for demo
  res.json({
    vendors: { today: 3, total: 1200 },
    orders: { today: 45, week: 320, total: 15000 },
    disputes: { pending: 7 },
    revenue: { today: 120000, week: 800000, total: 50000000 },
    sathiCost: { today: 2000, week: 14000, total: 900000 },
  });
}
