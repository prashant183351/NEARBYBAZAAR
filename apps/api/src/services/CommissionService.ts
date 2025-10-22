// Stub for CommissionService

import { calculateCommission as calcCommission, CommissionCalcInput } from './commission/calc';
import { getApplicableCommission, evaluateCommission, CommissionRule } from './commission/rules';

export const CommissionService = {
  async adjustForRefund(orderId: string, refundAmount: number) {
    // Simulate commission adjustment
    return `commission-adjust-${orderId}-${refundAmount}`;
  },

  /**
   * Synchronous commission calculation for unit tests (rule, amount)
   */
  calculateCommission(rule: CommissionRule, amount: number): number {
    return evaluateCommission(rule, amount);
  },

  /**
   * Async commission calculation for real use (input object)
   */
  async calculateCommissionAsync(input: CommissionCalcInput) {
    return calcCommission(input);
  },

  /**
   * Get applicable rule (sync for test, async for real)
   */
  getApplicableRule(rules: CommissionRule[], vendorId?: string, category?: string): CommissionRule | null {
    // Precedence: vendor > category > default
    if (!rules || rules.length === 0) return null;
    if (vendorId) {
      const found = rules.find(r => (r as any).vendorId === vendorId);
      if (found) return found;
    }
    if (category) {
      const found = rules.find(r => (r as any).categoryId === category);
      if (found) return found;
    }
    // Default
    return rules.find(r => !('vendorId' in r) && !('categoryId' in r)) || null;
  },

  // Async version for real DB-backed rules
  async getApplicableRuleAsync({ vendorId, category }: { vendorId?: string; category?: string }) {
    return getApplicableCommission({ vendorId, category });
  },
};
