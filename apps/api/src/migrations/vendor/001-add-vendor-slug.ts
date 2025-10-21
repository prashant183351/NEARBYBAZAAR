import { Vendor } from '../../models/Vendor';
import { generateSlug, dedupeSlug } from '@nearbybazaar/lib/slug';

export async function run() {
    // Ensure index exists (unique on slug)
    await Vendor.collection.createIndex({ slug: 1 }, { unique: true, name: 'uniq_vendor_slug' }).catch(() => { });

    // Backfill slugs where missing
    const cursor = Vendor.find({ $or: [{ slug: { $exists: false } }, { slug: '' }] }).cursor();
    for await (const doc of cursor as any) {
        const base = generateSlug(doc.name) || generateSlug(doc.email) || `vendor-${doc._id.toString().slice(-6)}`;
        // Gather existing similar slugs to dedupe
        const regex = new RegExp(`^${base}(?:-\\d+)?$`, 'i');
        const others = await Vendor.find({ slug: { $regex: regex }, _id: { $ne: doc._id } }).select('slug').lean();
        const existing = new Set<string>(others.map((o: any) => String(o.slug)));
        const unique = dedupeSlug(base, existing);
        doc.slug = unique;
        await doc.save();
    }

    // Optional: backfill slugHistory as empty array where missing (not strictly needed in Mongo)
    await Vendor.updateMany({ slugHistory: { $exists: false } }, { $set: { slugHistory: [] } });
}
