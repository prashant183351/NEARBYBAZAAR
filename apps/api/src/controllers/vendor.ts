import { Router } from 'express';
import { Vendor } from '../models/Vendor';
import { encryptKycDoc, watermarkKycDoc, verifyKycDocOCR } from '../services/kycDocSecurity';

const router = Router();

// KYC doc upload endpoint
router.post('/kyc/upload', async (req, res) => {
  const { vendorId, file, expected } = req.body;
  // file: Buffer, expected: { pan, gst }
  let buffer = Buffer.from(file, 'base64');
  // 1. Watermark
  buffer = Buffer.from(await watermarkKycDoc(buffer, vendorId));
  // 2. Encrypt
  const { iv } = encryptKycDoc(buffer, vendorId);
  // 3. OCR verify
  const { ocrVerified, ocrData } = await verifyKycDocOCR(buffer, expected);
  // 4. Save to vendor
  await Vendor.updateOne(
    { _id: vendorId },
    {
      $push: {
        kycDocs: {
          url: '', // TODO: upload encrypted buffer to storage, get URL
          encrypted: true,
          iv,
          watermarked: true,
          ocrVerified,
          ocrData,
        },
      },
    },
  );
  res.json({ success: true, ocrVerified, ocrData });
});

export default router;
