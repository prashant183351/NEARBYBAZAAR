import type { NextApiRequest, NextApiResponse } from 'next';
import axios from 'axios';

const API_URL = process.env.API_URL || 'http://localhost:4000/v1/admin/abtest';

export default async function handler(req: NextApiRequest, res: NextApiResponse) {
  try {
    if (req.method === 'GET') {
      const r = await axios.get(API_URL);
      res.status(200).json(r.data);
    } else if (req.method === 'POST') {
      const r = await axios.post(API_URL, req.body);
      res.status(200).json(r.data);
    } else {
      res.setHeader('Allow', ['GET', 'POST']);
      res.status(405).end('Method Not Allowed');
    }
  } catch (e: any) {
    res.status(500).json({ success: false, error: e.message });
  }
}
