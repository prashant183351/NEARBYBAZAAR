import { Router } from 'express';
import { uploadInvoiceToGSTN } from '../services/gstn';

const router = Router();

// POST /gstn/upload-invoice
router.post('/upload-invoice', async (req, res) => {
  try {
    const result = await uploadInvoiceToGSTN(req.body);
    res.json({ success: true, data: result });
  } catch (e: any) {
    res.status(400).json({ success: false, error: e.message });
  }
});

export default router;
