import express from 'express';
import { validate } from '../middleware/validate';
import { authorize } from '../middleware/authorize';
import { Order } from '../models/Order';
import { Invoice } from '../models/Invoice';
// import { FinNbizWebhookSchema } from '../schemas/FinNbizSchemas';
const FinNbizWebhookSchema = {} as any; // TODO: Replace with actual Zod schema

// Removed invalid module augmentation

const router = express.Router();

// Endpoint for FinNbiz to pull orders
router.get('/finnbiz/orders', authorize, async (_req, res) => {
    try {
        const orders = await Order.find({});
        res.json({ success: true, orders });
    } catch (error) {
        res.status(500).json({ error: 'Failed to fetch orders' });
    }
});

// Endpoint for FinNbiz to push invoices
router.post('/finnbiz/invoices', authorize, validate(FinNbizWebhookSchema), async (req, res) => {
    try {
        const invoiceData = req.body;
        const invoice = new Invoice(invoiceData);
        await invoice.save();
        res.json({ success: true, invoice });
    } catch (error) {
        res.status(500).json({ error: 'Failed to create invoice' });
    }
});

// Webhook for order creation
router.post('/finnbiz/webhooks/order-created', validate(FinNbizWebhookSchema), async (req, res) => {
    try {
        const { orderId, event } = req.body;
        console.log(`Received webhook for order ${orderId} with event ${event}`);
        res.json({ success: true });
    } catch (error) {
        res.status(500).json({ error: 'Failed to process webhook' });
    }
});

export default router;