import { CommissionService } from '../src/services/CommissionService';
import type { CommissionRule } from '../src/services/commission/rules';

describe('CommissionService', () => {
  describe('calculateCommission', () => {
    it('should calculate percentage commission', () => {
  const rule = { type: 'percentage', value: 10 } as CommissionRule;
      const amount = 1000;
      const result = CommissionService.calculateCommission(rule, amount);
      expect(result).toBe(100);
    });
    it('should calculate fixed commission', () => {
  const rule = { type: 'fixed', value: 50 } as CommissionRule;
      const amount = 1000;
      const result = CommissionService.calculateCommission(rule, amount);
      expect(result).toBe(50);
    });
    it('should calculate tiered commission', () => {
      const rule = {
        type: 'tiered',
        tiers: [
          { min: 0, max: 500, rate: 5 },
          { min: 501, max: 1000, rate: 10 },
          { min: 1001, rate: 15 },
        ],
      } as CommissionRule;
      expect(CommissionService.calculateCommission(rule, 400)).toBe(20); // 5%
      expect(CommissionService.calculateCommission(rule, 800)).toBe(80); // 10%
      expect(CommissionService.calculateCommission(rule, 1500)).toBe(225); // 15%
    });
    it('should return 0 for unknown rule type', () => {
  const rule = { type: 'unknown', value: 10 } as any;
      const amount = 1000;
      const result = CommissionService.calculateCommission(rule, amount);
      expect(result).toBe(0);
    });
  });

  describe('getApplicableRule', () => {
    it('should return vendor override if present', () => {
      const rules = [
        { type: 'percentage', value: 10, vendorId: 'v1' },
        { type: 'percentage', value: 5 },
      ];
      const result = CommissionService.getApplicableRule(rules as any, 'v1', 'cat1');
      expect((result as any).vendorId).toBe('v1');
    });
    it('should return category rule if no vendor override', () => {
      const rules = [
        { type: 'percentage', value: 10, categoryId: 'cat1' },
        { type: 'percentage', value: 5 },
      ];
      const result = CommissionService.getApplicableRule(rules as any, 'v2', 'cat1');
      expect((result as any).categoryId).toBe('cat1');
    });
    it('should return default rule if no match', () => {
      const rules = [
        { type: 'percentage', value: 10, categoryId: 'cat1' },
        { type: 'percentage', value: 5 },
      ];
      const result = CommissionService.getApplicableRule(rules as any, 'v2', 'cat2');
      expect(result.value).toBe(5);
    });
    it('should return null if no rules', () => {
  const result = CommissionService.getApplicableRule([], 'v2', 'cat2');
  expect(result).toBeNull();
    });
  });
});
