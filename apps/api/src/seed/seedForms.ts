import mongoose from 'mongoose';
import { Form } from '../models/Form';

export async function seedForms() {
    await mongoose.connect(process.env.MONGO_URI || 'mongodb://localhost:27017/nearbybazaar');

    const forms = [
        {
            name: 'Contact Us',
            description: 'Basic contact form',
            fields: [
                { type: 'text', name: 'name', label: 'Name', required: true },
                { type: 'email', name: 'email', label: 'Email', required: true },
                { type: 'textarea', name: 'message', label: 'Message', required: true },
            ],
        },
        {
            name: 'Vendor Application',
            description: 'Apply to become a vendor',
            fields: [
                { type: 'text', name: 'business', label: 'Business Name', required: true },
                { type: 'email', name: 'email', label: 'Contact Email', required: true },
                { type: 'file', name: 'license', label: 'Business License', required: false },
            ],
        },
    ];

    for (const form of forms) {
        await Form.create(form);
    }

    console.log('Seeded sample forms.');
    await mongoose.disconnect();
}

if (require.main === module) {
    seedForms().catch(console.error);
}
