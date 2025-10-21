import request from 'supertest';
import app from '../src/app';
import { ClassifiedPlan } from '../src/models/ClassifiedPlan';
import { Subscription } from '../src/models/Subscription';
import mongoose from 'mongoose';

describe('Plan Logic', () => {
    beforeAll(async () => {
        await mongoose.connect(process.env.MONGO_URL || '', { dbName: 'test' });
        await ClassifiedPlan.deleteMany({});
        await Subscription.deleteMany({});
    });
    afterAll(async () => {
        await mongoose.disconnect();
    });

    it('should enforce plan quota for listings', async () => {
        const plan = await ClassifiedPlan.create({ name: 'Free', tier: 'Free', maxListings: 1, price: 0, currency: 'INR' });
        // Simulate vendor subscription
        const sub = await Subscription.create({ vendor: 'vendor1', plan: plan._id, startDate: new Date(), status: 'active' });
        // Try to create two listings
        // ...simulate API call and expect error on second
    });

    it('should allow upgrade from Free to Pro', async () => {
        const free = await ClassifiedPlan.create({ name: 'Free', tier: 'Free', maxListings: 1, price: 0, currency: 'INR' });
        const pro = await ClassifiedPlan.create({ name: 'Pro', tier: 'Pro', maxListings: 10, price: 100, currency: 'INR' });
        const sub = await Subscription.create({ vendor: 'vendor2', plan: free._id, startDate: new Date(), status: 'active' });
        // Simulate upgrade
        sub.plan = pro._id;
        await sub.save();
        expect(sub.plan.toString()).toBe(pro._id.toString());
    });

    it('should restrict downgrade if quota exceeded', async () => {
        const pro = await ClassifiedPlan.create({ name: 'Pro', tier: 'Pro', maxListings: 10, price: 100, currency: 'INR' });
        const free = await ClassifiedPlan.create({ name: 'Free', tier: 'Free', maxListings: 1, price: 0, currency: 'INR' });
        const sub = await Subscription.create({ vendor: 'vendor3', plan: pro._id, startDate: new Date(), status: 'active' });
        // Simulate vendor has 5 listings
        // ...simulate API call to downgrade and expect error
    });

    it('should allow admin to create/update/delete plans', async () => {
        // Simulate admin token
        const token = 'admin-token';
        // Create
        await request(app)
            .post('/admin/plans')
            .set('Authorization', `Bearer ${token}`)
            .send({ name: 'Featured', tier: 'Featured', maxListings: 20, price: 200, currency: 'INR' })
            .expect(201);
        // Update
        // ...
        // Delete
        // ...
    });
});
