import type { NextApiRequest, NextApiResponse } from 'next';
import axios from 'axios';

const API_BASE =
  process.env.NEXT_PUBLIC_API_URL || process.env.API_URL || 'http://localhost:4000/v1/rfq';

export default async function handler(req: NextApiRequest, res: NextApiResponse) {
  const segments = (req.query.path as string[] | undefined) || [];
  const url = `${API_BASE}/${segments.join('/')}`.replace(/\/$/, '');
  try {
    const method = req.method || 'GET';
    const config = method === 'GET' ? { params: req.query } : {};
    const r = await axios({ url, method, data: req.body, ...(config as any) });
    res.status(200).json(r.data);
  } catch (e: any) {
    res
      .status(e?.response?.status || 500)
      .json({ success: false, error: e.message, details: e?.response?.data });
  }
}
