import mongoose from 'mongoose';
import { User } from '../models/User';
import { Vendor } from '../models/Vendor';
import { Product } from '../models/Product';
import { Service } from '../models/Service';
import { seedB2BData } from './b2bSampleData';

/**
 * Seed core development data (idempotent):
 * - Admin user, sample buyer user, sample vendor owner
 * - Vendor (owned by vendor user)
 * - A few products and one service
 */
export async function seedDevData() {
    console.log('🌱 Seeding development data...');

    // Users
    const users = [
        { email: 'admin@nearbybazaar.dev', name: 'Admin User', password: 'admin123', role: 'admin' as const },
        { email: 'buyer@nearbybazaar.dev', name: 'Buyer User', password: 'buyer123', role: 'user' as const },
        { email: 'vendor@nearbybazaar.dev', name: 'Vendor Owner', password: 'vendor123', role: 'vendor' as const },
    ];

    const userIds: Record<string, mongoose.Types.ObjectId> = {} as any;
    for (const u of users) {
        const existing = await User.findOne({ email: u.email });
        if (existing) {
            await User.updateOne({ _id: existing._id }, { $set: { name: u.name, role: u.role } });
            userIds[u.email] = existing._id as any;
            console.log(`  ↻ User updated: ${u.email}`);
        } else {
            const created = await User.create(u as any);
            userIds[u.email] = created._id as any;
            console.log(`  ✓ User created: ${u.email}`);
        }
    }

    // Vendor
    const vendorEmail = 'store@sample-vendor.dev';
    const vendorOwnerId = userIds['vendor@nearbybazaar.dev'];
    const vendorName = 'Sample Vendor Store';
    let vendor = await Vendor.findOne({ email: vendorEmail });
    if (vendor) {
        await Vendor.updateOne({ _id: vendor._id }, { $set: { name: vendorName, owner: vendorOwnerId } });
        vendor = await Vendor.findById(vendor._id);
        console.log(`  ↻ Vendor updated: ${vendorName}`);
    } else {
        vendor = await Vendor.create({ email: vendorEmail, name: vendorName, owner: vendorOwnerId } as any);
        console.log(`  ✓ Vendor created: ${vendorName}`);
    }

    // Products (minimal fields, rely on hooks for sku/slug)
    const products = [
        { name: 'Wireless Earbuds ANC', description: 'Noise-cancelling wireless earbuds with long battery life.', price: 2999, currency: 'INR', category: 'electronics' },
        { name: 'Stainless Steel Water Bottle', description: 'Insulated bottle keeps drinks cold for 24h.', price: 899, currency: 'INR', category: 'home' },
        { name: 'Yoga Mat Pro', description: 'Non-slip yoga mat with extra cushioning.', price: 1299, currency: 'INR', category: 'fitness' },
    ];

    for (const p of products) {
        const existing = await Product.findOne({ name: p.name, vendor: vendor!._id });
        if (existing) {
            await Product.updateOne({ _id: existing._id }, { $set: { description: p.description, price: p.price, currency: p.currency } });
            console.log(`  ↻ Product updated: ${p.name}`);
        } else {
            await Product.create({ ...p, vendor: vendor!._id } as any);
            console.log(`  ✓ Product created: ${p.name}`);
        }
    }

    // Service
    const service = { name: 'Mobile Repair Basic', description: 'Screen and battery replacement service.', price: 499, currency: 'INR', duration: 60 };
    const svcExisting = await Service.findOne({ name: service.name, vendor: vendor!._id });
    if (svcExisting) {
        await Service.updateOne({ _id: svcExisting._id }, { $set: { description: service.description, price: service.price, currency: service.currency, duration: service.duration } });
        console.log(`  ↻ Service updated: ${service.name}`);
    } else {
        await Service.create({ ...service, vendor: vendor!._id } as any);
        console.log(`  ✓ Service created: ${service.name}`);
    }

    console.log('✅ Development data seeding complete');

    // Optionally seed B2B sample data
    if (process.env.SEED_B2B_DATA === 'true') {
        console.log('\n🏢 SEED_B2B_DATA=true, seeding B2B sample data...');
        await seedB2BData();
    } else {
        console.log('\n💡 Tip: Set SEED_B2B_DATA=true to include B2B sample data (products with tiered pricing, RFQs, bulk orders)');
    }
}

if (require.main === module) {
    // Allow running standalone for quick dev
    const { connectMongo, disconnectMongo } = require('../db');
    connectMongo()
        .then(() => seedDevData())
        .then(() => disconnectMongo())
        .catch((e: any) => {
            console.error('Dev seeding failed:', e);
            process.exit(1);
        });
}
