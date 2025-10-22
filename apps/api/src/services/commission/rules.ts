// Commission rule evaluation logic
import { Commission } from '../../models/Commission';

export type CommissionRule = {
  type: 'fixed' | 'percentage' | 'tiered';
  value?: number;
  tiers?: Array<{ min: number; max?: number; rate: number }>;
};

export function evaluateCommission(rules: CommissionRule, amount: number): number {
  if (rules.type === 'fixed') {
    return rules.value || 0;
  }
  if (rules.type === 'percentage') {
    return ((rules.value || 0) / 100) * amount;
  }
  if (rules.type === 'tiered' && rules.tiers) {
    for (const tier of rules.tiers) {
      if (amount >= tier.min && (tier.max === undefined || amount <= tier.max)) {
        return (tier.rate / 100) * amount;
      }
    }
    // If no tier matches, fallback to 0
    return 0;
  }
  return 0;
}

// Precedence: vendor > category > default
export async function getApplicableCommission({
  vendorId,
  category,
}: {
  vendorId?: string;
  category?: string;
}): Promise<CommissionRule | null> {
  let commission = null;
  if (vendorId) {
    commission = await Commission.findOne({ vendor: vendorId, active: true, deleted: false });
  }
  if (!commission && category) {
    commission = await Commission.findOne({ category, active: true, deleted: false });
  }
  if (!commission) {
    commission = await Commission.findOne({ active: true, deleted: false });
  }
  if (!commission) return null;
  return {
    type: commission.type,
    value: commission.value,
    tiers: commission.tiers,
  };
}
