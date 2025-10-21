import { getRateByHSN, getRateBySAC, getDefaultRate } from './rates';

export type Party = { stateCode: string; gstin?: string };
export type Line = {
  description: string;
  amount: number; // taxable value per line (already considering discounts)
  quantity?: number;
  code?: string; // HSN or SAC
  type: 'goods' | 'services';
};

export type GSTBreakdown = {
  taxable: number;
  rate: number;
  igst: number;
  cgst: number;
  sgst: number;
  totalTax: number;
  grandTotal: number;
};

export function round2(n: number): number {
  return Math.round(n * 100) / 100;
}

export function isInterState(seller: Party, buyer: Party): boolean {
  return (seller.stateCode || '').toUpperCase() !== (buyer.stateCode || '').toUpperCase();
}

export function lookupRate(line: Line): number {
  const code = (line.code || '').trim();
  if (line.type === 'goods') {
    const r = code ? getRateByHSN(code) : null;
    return r !== null ? r : getDefaultRate();
  } else {
    const r = code ? getRateBySAC(code) : null;
    return r !== null ? r : getDefaultRate();
  }
}

export function computeGSTForLines(seller: Party, buyer: Party, lines: Line[]): GSTBreakdown {
  const taxable = round2(lines.reduce((sum, l) => sum + l.amount, 0));
  const rate = Math.max(...lines.map(lookupRate));
  const tax = round2((taxable * rate) / 100);

  if (isInterState(seller, buyer)) {
    const igst = tax;
    return {
      taxable,
      rate,
      igst,
      cgst: 0,
      sgst: 0,
      totalTax: igst,
      grandTotal: round2(taxable + igst),
    };
  }

  const half = round2(tax / 2);
  const cgst = half;
  const sgst = round2(tax - cgst);

  return {
    taxable,
    rate,
    igst: 0,
    cgst,
    sgst,
    totalTax: round2(cgst + sgst),
    grandTotal: round2(taxable + cgst + sgst),
  };
}

export function formatINR(n: number): string {
  return new Intl.NumberFormat('en-IN', { style: 'currency', currency: 'INR', minimumFractionDigits: 2 }).format(n);
}
