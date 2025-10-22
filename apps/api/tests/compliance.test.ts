import { Types } from 'mongoose';
import { AgreementModel, AgreementAcceptanceModel } from '../src/models/Agreement';
import {
  hasAcceptedLatestAgreement,
  getPendingAgreements,
  recordAcceptance,
  enforceCompliance,
} from '../src/services/compliance';

describe('Compliance Service', () => {
  const vendorId = new Types.ObjectId();

  beforeEach(async () => {
    await AgreementModel.deleteMany({});
    await AgreementAcceptanceModel.deleteMany({});
  });

  describe('hasAcceptedLatestAgreement', () => {
    it('returns true if no agreement exists', async () => {
      const result = await hasAcceptedLatestAgreement(vendorId, 'vendor', 'sla');
      expect(result).toBe(true);
    });

    it('returns false if latest agreement not accepted', async () => {
      await AgreementModel.create({
        type: 'sla',
        version: '1.0',
        title: 'SLA v1.0',
        content: 'Terms...',
        effectiveDate: new Date(),
      });

      const result = await hasAcceptedLatestAgreement(vendorId, 'vendor', 'sla');
      expect(result).toBe(false);
    });

    it('returns true if latest agreement is accepted', async () => {
      const agreement = await AgreementModel.create({
        type: 'sla',
        version: '1.0',
        title: 'SLA v1.0',
        content: 'Terms...',
        effectiveDate: new Date(),
      });

      await AgreementAcceptanceModel.create({
        agreementId: agreement._id,
        agreementVersion: agreement.version,
        acceptorId: vendorId,
        acceptorType: 'vendor',
      });

      const result = await hasAcceptedLatestAgreement(vendorId, 'vendor', 'sla');
      expect(result).toBe(true);
    });

    it('returns false if new version released after acceptance', async () => {
      const oldAgreement = await AgreementModel.create({
        type: 'sla',
        version: '1.0',
        title: 'SLA v1.0',
        content: 'Terms...',
        effectiveDate: new Date('2024-01-01'),
      });

      await AgreementAcceptanceModel.create({
        agreementId: oldAgreement._id,
        agreementVersion: oldAgreement.version,
        acceptorId: vendorId,
        acceptorType: 'vendor',
      });

      // New version released
      await AgreementModel.create({
        type: 'sla',
        version: '2.0',
        title: 'SLA v2.0',
        content: 'New terms...',
        effectiveDate: new Date('2025-01-01'),
      });

      const result = await hasAcceptedLatestAgreement(vendorId, 'vendor', 'sla');
      expect(result).toBe(false);
    });
  });

  describe('getPendingAgreements', () => {
    it('returns empty array if all agreements accepted', async () => {
      const agreement = await AgreementModel.create({
        type: 'sla',
        version: '1.0',
        title: 'SLA v1.0',
        content: 'Terms...',
        effectiveDate: new Date(),
      });

      await AgreementAcceptanceModel.create({
        agreementId: agreement._id,
        agreementVersion: agreement.version,
        acceptorId: vendorId,
        acceptorType: 'vendor',
      });

      const pending = await getPendingAgreements(vendorId, 'vendor');
      expect(pending).toHaveLength(0);
    });

    it('returns pending agreements', async () => {
      await AgreementModel.create({
        type: 'sla',
        version: '1.0',
        title: 'SLA v1.0',
        content: 'SLA terms...',
        effectiveDate: new Date(),
      });

      await AgreementModel.create({
        type: 'compliance',
        version: '1.0',
        title: 'Compliance v1.0',
        content: 'Compliance terms...',
        effectiveDate: new Date(),
      });

      const pending = await getPendingAgreements(vendorId, 'vendor');
      expect(pending).toHaveLength(2);
      expect(pending.map((p) => p.type)).toContain('sla');
      expect(pending.map((p) => p.type)).toContain('compliance');
    });
  });

  describe('enforceCompliance', () => {
    it('throws error if critical agreement not accepted', async () => {
      await AgreementModel.create({
        type: 'sla',
        version: '1.0',
        title: 'SLA v1.0',
        content: 'Terms...',
        effectiveDate: new Date(),
      });

      await expect(enforceCompliance(vendorId, 'vendor', ['sla'])).rejects.toThrow(
        'You must accept the latest sla agreement to proceed.',
      );
    });

    it('does not throw if all critical agreements accepted', async () => {
      const agreement = await AgreementModel.create({
        type: 'sla',
        version: '1.0',
        title: 'SLA v1.0',
        content: 'Terms...',
        effectiveDate: new Date(),
      });

      await AgreementAcceptanceModel.create({
        agreementId: agreement._id,
        agreementVersion: agreement.version,
        acceptorId: vendorId,
        acceptorType: 'vendor',
      });

      await expect(enforceCompliance(vendorId, 'vendor', ['sla'])).resolves.not.toThrow();
    });
  });

  describe('recordAcceptance', () => {
    it('records acceptance with audit info', async () => {
      const agreement = await AgreementModel.create({
        type: 'sla',
        version: '1.0',
        title: 'SLA v1.0',
        content: 'Terms...',
        effectiveDate: new Date(),
      });

      await recordAcceptance(agreement._id!, vendorId, 'vendor', '192.168.1.1', 'Mozilla/5.0');

      const acceptance = await AgreementAcceptanceModel.findOne({
        agreementId: agreement._id,
        acceptorId: vendorId,
      });

      expect(acceptance).toBeTruthy();
      expect(acceptance?.ipAddress).toBe('192.168.1.1');
      expect(acceptance?.userAgent).toBe('Mozilla/5.0');
      expect(acceptance?.agreementVersion).toBe('1.0');
    });

    it('throws if agreement not found', async () => {
      const fakeId = new Types.ObjectId();
      await expect(recordAcceptance(fakeId, vendorId, 'vendor')).rejects.toThrow(
        'Agreement not found',
      );
    });
  });
});
