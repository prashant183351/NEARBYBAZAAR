import { Router } from 'express';
import { canExportVendorPII, checkAbac } from '../services/abac';

const router = Router();

router.get('/vendor/export-pii', async (req, res) => {
  if (!checkAbac(canExportVendorPII, req)) {
    return res
      .status(403)
      .json({ error: 'PII export requires admin, OTP verification, and office IP.' });
  }

  // ...existing export logic...

  res.json({ success: true, data: 'PII export' });
});

export default router;
