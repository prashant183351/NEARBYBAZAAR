import express from 'express';
import { sendRetargetingEmails } from '../services/retargeting';

const router = express.Router();

// Endpoint to trigger retargeting emails manually
router.post('/retargeting/send', async (req, res) => {
  const { days } = req.body;

  if (!days || typeof days !== 'number') {
    return res.status(400).json({ error: 'Invalid or missing `days` parameter' });
  }

  try {
    await sendRetargetingEmails(days);
    res.status(200).json({ message: 'Retargeting emails sent successfully' });
  } catch (error) {
    console.error('Error sending retargeting emails:', error);
    res.status(500).json({ error: 'Failed to send retargeting emails' });
  }
});

export default router;
