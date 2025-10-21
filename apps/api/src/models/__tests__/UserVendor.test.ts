import mongoose from 'mongoose';
import { User } from '../User';
import { Vendor } from '../Vendor';

describe('User & Vendor Models', () => {
    beforeAll(async () => {
        await mongoose.connect('mongodb://localhost:27017/nearbybazaar_test');
        await User.deleteMany({});
        await Vendor.deleteMany({});
    });
    afterAll(async () => {
        await mongoose.disconnect();
    });

    it('should enforce unique email for users', async () => {
        await User.create({ email: 'unique@bazaar.com', password: 'pw123456', name: 'A', role: 'user' });
        await expect(User.create({ email: 'unique@bazaar.com', password: 'pw123456', name: 'B', role: 'user' })).rejects.toThrow();
    });

    it('should create a vendor with owner', async () => {
        const user = await User.create({ email: 'owner@bazaar.com', password: 'pw123456', name: 'Owner', role: 'vendor' });
        const vendor = await Vendor.create({ email: 'vendor@bazaar.com', name: 'Vendor', owner: user._id });
        expect(vendor.owner.toString()).toBe(user._id.toString());
    });

    it('should soft delete user', async () => {
        const user = await User.create({ email: 'del@bazaar.com', password: 'pw123456', name: 'Del', role: 'user' });
        user.deleted = true;
        await user.save();
        const found = await User.findById(user._id);
        expect(found?.deleted).toBe(true);
    });
});
