import { getApplicableCommission, evaluateCommission } from './rules';

export interface CommissionCalcInput {
  price: number;
  category?: string;
  vendorId?: string;
  quantity?: number;
}

export interface CommissionCalcResult {
  commission: number;
  rule: {
    type: string;
    value?: number;
    tiers?: Array<{ min: number; max?: number; rate: number }>;
  } | null;
  breakdown: {
    price: number;
    quantity: number;
    appliedRule: string;
    commission: number;
  };
}

export async function calculateCommission(
  input: CommissionCalcInput,
): Promise<CommissionCalcResult> {
  const { price, category, vendorId, quantity = 1 } = input;
  const rule = await getApplicableCommission({ vendorId, category });
  const commission = rule ? Math.round(evaluateCommission(rule, price) * quantity * 100) / 100 : 0;
  return {
    commission,
    rule,
    breakdown: {
      price,
      quantity,
      appliedRule: rule ? rule.type : 'none',
      commission,
    },
  };
}
