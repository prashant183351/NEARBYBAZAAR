import mongoose from 'mongoose';
import { Kaizen } from '../models/Kaizen';

export async function seedKaizen() {
    await mongoose.connect(process.env.MONGO_URI || 'mongodb://localhost:27017/nearbybazaar');

    const ideas = [
        {
            title: 'Add dark mode',
            description: 'Implement dark mode for better accessibility.',
            tags: ['ui', 'accessibility'],
            owner: '000000000000000000000001',
            rice: { reach: 8, impact: 7, confidence: 9, effort: 3 },
        },
        {
            title: 'Vendor analytics dashboard',
            description: 'Give vendors insights into their sales and traffic.',
            tags: ['vendor', 'analytics'],
            owner: '000000000000000000000001',
            rice: { reach: 6, impact: 8, confidence: 7, effort: 5 },
        },
        {
            title: 'Automated product recommendations',
            description: 'Suggest products to users based on browsing history.',
            tags: ['recommendation', 'ai'],
            owner: '000000000000000000000001',
            rice: { reach: 9, impact: 8, confidence: 6, effort: 7 },
        },
    ];

    for (const idea of ideas) {
        await Kaizen.create(idea);
    }

    console.log('Seeded kaizen ideas.');
    await mongoose.disconnect();
}

if (require.main === module) {
    seedKaizen().catch(console.error);
}
