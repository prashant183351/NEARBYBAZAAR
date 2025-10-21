import type { NextApiRequest, NextApiResponse } from 'next';
import axios from 'axios';

const API_BASE = process.env.NEXT_PUBLIC_API_URL || process.env.API_URL || 'http://localhost:4000/v1/rfq';

export default async function handler(req: NextApiRequest, res: NextApiResponse) {
  const segments = (req.query.path as string[] | undefined) || [];
  const url = `${API_BASE}/${segments.join('/')}`.replace(/\/$/, '');
  try {
    switch (req.method) {
      case 'GET': {
        const r = await axios.get(url, { params: req.query });
        res.status(200).json(r.data);
        break;
      }
      case 'POST': {
        const r = await axios.post(url, req.body);
        res.status(200).json(r.data);
        break;
      }
      case 'PUT': {
        const r = await axios.put(url, req.body);
        res.status(200).json(r.data);
        break;
      }
      default:
        res.setHeader('Allow', ['GET', 'POST', 'PUT']);
        res.status(405).end('Method Not Allowed');
    }
  } catch (e: any) {
    res.status(e?.response?.status || 500).json({ success: false, error: e.message, details: e?.response?.data });
  }
}