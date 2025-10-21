import type { NextApiRequest, NextApiResponse } from 'next';
import axios from 'axios';

const API_URL = (process.env.NEXT_PUBLIC_API_URL || process.env.API_URL || 'http://localhost:4000') + '/v1/rfq/vendor';

export default async function handler(req: NextApiRequest, res: NextApiResponse) {
  try {
    if (req.method !== 'GET') {
      res.setHeader('Allow', ['GET']);
      return res.status(405).end('Method Not Allowed');
    }
    const r = await axios.get(API_URL, { params: req.query });
    res.status(200).json(r.data);
  } catch (e: any) {
    res.status(e?.response?.status || 500).json({ success: false, error: e.message, details: e?.response?.data });
  }
}