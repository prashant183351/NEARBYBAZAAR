import { Types } from 'mongoose';
import { SlugHistory, SlugType } from '../models/SlugHistory';

/**
 * Record a slug change. If oldSlug === newSlug, no-op. Upserts for (type, oldSlug).
 */
export async function recordSlugChange(params: {
    type: SlugType;
    resourceId?: Types.ObjectId | string;
    oldSlug?: string | null;
    newSlug: string;
}) {
    const { type, resourceId, oldSlug, newSlug } = params;
    if (!oldSlug || oldSlug === newSlug) return;
    await SlugHistory.findOneAndUpdate(
        { type, oldSlug },
        { $set: { newSlug, resourceId: resourceId ? new Types.ObjectId(resourceId) : undefined, updatedAt: new Date() } },
        { upsert: true, new: true }
    );
}

/**
 * Resolve a slug chain to the latest slug. Protects against loops and long chains.
 * Returns null if no mapping exists.
 */
export async function resolveLatestSlug(type: SlugType, slug: string, opts?: { maxDepth?: number }) {
    const visited = new Set<string>();
    let current = slug;
    const maxDepth = opts?.maxDepth ?? 10;
    for (let i = 0; i < maxDepth; i++) {
        if (visited.has(current)) {
            // loop detected
            return null;
        }
        visited.add(current);
        const entry = await SlugHistory.findOne({ type, oldSlug: current }).lean();
        if (!entry) return current === slug ? null : current; // if first lookup and not found -> null
        current = entry.newSlug;
    }
    return current;
}
