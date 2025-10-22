import mongoose from 'mongoose';
import { MongoMemoryServer } from 'mongodb-memory-server';
import { Vendor } from '../src/models/Vendor';

describe('Vendor slug behavior', () => {
  let mongod: MongoMemoryServer;
  beforeAll(async () => {
    mongod = await MongoMemoryServer.create();
    const uri = mongod.getUri();
    await mongoose.connect(uri, { dbName: 'test' } as any);
    await Vendor.deleteMany({});
  });
  afterAll(async () => {
    await mongoose.disconnect();
    await mongod.stop();
  });

  it('generates slug from name and enforces uniqueness', async () => {
    const v1 = await Vendor.create({
      email: 'a@example.com',
      name: 'ACME Store',
      owner: new mongoose.Types.ObjectId(),
    });
    const v2 = await Vendor.create({
      email: 'b@example.com',
      name: 'ACME Store',
      owner: new mongoose.Types.ObjectId(),
    });
    expect(v1.slug).toMatch(/^acme-store/);
    expect(v2.slug).toMatch(/^acme-store/);
    expect(v1.slug).not.toBe(v2.slug);
  });

  it('updates slug and keeps history on name change', async () => {
    const v = await Vendor.create({
      email: 'c@example.com',
      name: 'Cool Shop',
      owner: new mongoose.Types.ObjectId(),
    });
    const old = v.slug;
    v.name = 'Cooler Shop';
    await v.save();
    expect(v.slug).toMatch(/^cooler-shop/);
    expect(v.slugHistory).toContain(old);
  });
});
