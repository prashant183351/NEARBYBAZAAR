import { AuditLog, verifyAuditChain, logAuditEvent, getLatestAuditHash } from '../src/models/ImmutableAudit';
import mongoose from 'mongoose';
import { MongoMemoryServer } from 'mongodb-memory-server';

describe('ImmutableAudit', () => {
    let mongoServer: MongoMemoryServer;

    beforeAll(async () => {
        mongoServer = await MongoMemoryServer.create();
        const uri = mongoServer.getUri();
        await mongoose.connect(uri);
    });

    afterAll(async () => {
        await mongoose.disconnect();
        await mongoServer.stop();
    });

    afterEach(async () => {
        await AuditLog.deleteMany({});
    });

    it('should create audit log with hash chain', async () => {
        const log1 = await logAuditEvent({
            userId: 'user1',
            action: 'login',
            resource: 'auth',
        });

        expect(log1.hash).toBeDefined();
        expect(log1.prevHash).toBe('0'.repeat(64)); // Genesis
        expect(log1.hash.length).toBe(64);

        const log2 = await logAuditEvent({
            userId: 'user1',
            action: 'create',
            resource: 'product',
            resourceId: 'prod123',
        });

        expect(log2.prevHash).toBe(log1.hash);
        expect(log2.hash).toBeDefined();
        expect(log2.hash).not.toBe(log1.hash);
    });

    it('should prevent modifications to existing logs', async () => {
        const log = await logAuditEvent({
            userId: 'user1',
            action: 'login',
            resource: 'auth',
        });

        // Try to modify
        log.action = 'logout';
        await expect(log.save()).rejects.toThrow('Audit logs are immutable');
    });

    it('should prevent updates via findOneAndUpdate', async () => {
        const log = await logAuditEvent({
            userId: 'user1',
            action: 'login',
            resource: 'auth',
        });

        await expect(
            AuditLog.findOneAndUpdate({ _id: log._id }, { action: 'logout' })
        ).rejects.toThrow('Audit logs cannot be updated');
    });

    it('should prevent deletion', async () => {
        const log = await logAuditEvent({
            userId: 'user1',
            action: 'login',
            resource: 'auth',
        });

        await expect(
            AuditLog.findOneAndDelete({ _id: log._id })
        ).rejects.toThrow('Audit logs cannot be deleted');
    });

    it('should verify valid audit chain', async () => {
        await logAuditEvent({ userId: 'u1', action: 'a1', resource: 'r1' });
        await logAuditEvent({ userId: 'u2', action: 'a2', resource: 'r2' });
        await logAuditEvent({ userId: 'u3', action: 'a3', resource: 'r3' });

        const result = await verifyAuditChain();
        expect(result.valid).toBe(true);
        expect(result.message).toContain('Verified 3 logs');
    });

    it('should detect tampered log content', async () => {
        const log1 = await logAuditEvent({ userId: 'u1', action: 'a1', resource: 'r1' });
        await logAuditEvent({ userId: 'u2', action: 'a2', resource: 'r2' });

        // Directly modify DB (simulating tampering)
        await AuditLog.collection.updateOne(
            { _id: log1._id as any },
            { $set: { action: 'tampered' } }
        );

        const result = await verifyAuditChain();
        expect(result.valid).toBe(false);
        expect(result.brokenAt).toBe(log1.id);
        expect(result.message).toContain('invalid hash');
    });

    it('should detect broken chain link', async () => {
        await logAuditEvent({ userId: 'u1', action: 'a1', resource: 'r1' });
        const log2 = await logAuditEvent({ userId: 'u2', action: 'a2', resource: 'r2' });

        // Break the chain by modifying prevHash
        await AuditLog.collection.updateOne(
            { _id: log2._id as any },
            { $set: { prevHash: 'invalid' } }
        );

        const result = await verifyAuditChain();
        expect(result.valid).toBe(false);
        expect(result.brokenAt).toBe(log2.id);
        expect(result.message).toContain('broken chain link');
    });

    it('should get latest hash for anchoring', async () => {
        const emptyHash = await getLatestAuditHash();
        expect(emptyHash).toBeNull();

        await logAuditEvent({ userId: 'u1', action: 'a1', resource: 'r1' });
        const log2 = await logAuditEvent({ userId: 'u2', action: 'a2', resource: 'r2' });

        const latestHash = await getLatestAuditHash();
        expect(latestHash).toBe(log2.hash);
    });

    it('should support metadata in logs', async () => {
        const log = await logAuditEvent({
            userId: 'admin1',
            action: 'payout',
            resource: 'payment',
            resourceId: 'pay123',
            metadata: { amount: 1000, currency: 'INR', vendorId: 'v1' },
        });

        expect(log.metadata).toEqual({ amount: 1000, currency: 'INR', vendorId: 'v1' });
    });
});
