import request from 'supertest';
import mongoose from 'mongoose';
import app from '../src/app';
import { SlugHistory } from '../src/models/SlugHistory';
import { recordSlugChange, resolveLatestSlug } from '../src/services/slugHistory';

describe('Slug History', () => {
  beforeAll(async () => {
    await mongoose.connect(process.env.MONGO_URL || '', { dbName: 'test' });
    await SlugHistory.deleteMany({});
  });
  afterAll(async () => {
    await mongoose.disconnect();
  });

  it('records and resolves simple mapping', async () => {
    await recordSlugChange({ type: 'product', oldSlug: 'old-a', newSlug: 'new-a' });
    const latest = await resolveLatestSlug('product', 'old-a');
    expect(latest).toBe('new-a');
  });

  it('resolves chained mappings with max depth', async () => {
    await recordSlugChange({ type: 'product', oldSlug: 'a', newSlug: 'b' });
    await recordSlugChange({ type: 'product', oldSlug: 'b', newSlug: 'c' });
    await recordSlugChange({ type: 'product', oldSlug: 'c', newSlug: 'd' });
    const latest = await resolveLatestSlug('product', 'a');
    expect(latest).toBe('d');
  });

  it('prevents loops', async () => {
    await SlugHistory.deleteMany({ type: 'service' });
    await recordSlugChange({ type: 'service', oldSlug: 'x', newSlug: 'y' });
    await recordSlugChange({ type: 'service', oldSlug: 'y', newSlug: 'x' }); // loop
    const latest = await resolveLatestSlug('service', 'x', { maxDepth: 5 });
    expect(latest).toBeNull();
  });

  it('slug resolve route responds 301 with Location', async () => {
    await SlugHistory.deleteMany({ type: 'vendor' });
    await recordSlugChange({ type: 'vendor', oldSlug: 'old-shop', newSlug: 'new-shop' });
    const res = await request(app).get('/v1/slug/resolve/vendor/old-shop');
    expect(res.status).toBe(301);
    expect(res.headers['location']).toBe('/store/new-shop');
  });
});
