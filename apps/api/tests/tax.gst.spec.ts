import { computeGSTForLines, formatINR } from '../src/services/tax/gst';

describe('GST engine', () => {
  const seller = { stateCode: 'KA', gstin: '29ABCDE1234F1Z5' };

  it('splits CGST/SGST for intrastate', () => {
    const buyer = { stateCode: 'KA' };
    const out = computeGSTForLines(seller, buyer, [
      { description: 'Phone', amount: 1000, type: 'goods', code: '8517' },
    ]);
    expect(out.igst).toBe(0);
    expect(out.cgst).toBe(90);
    expect(out.sgst).toBe(90);
    expect(out.totalTax).toBe(180);
    expect(out.grandTotal).toBe(1180);
  });

  it('applies IGST for interstate', () => {
    const buyer = { stateCode: 'MH' };
    const out = computeGSTForLines(seller, buyer, [
      { description: 'Phone', amount: 1000, type: 'goods', code: '8517' },
    ]);
    expect(out.igst).toBe(180);
    expect(out.cgst).toBe(0);
    expect(out.sgst).toBe(0);
    expect(out.totalTax).toBe(180);
    expect(out.grandTotal).toBe(1180);
  });

  it('handles rounding split small values', () => {
    const buyer = { stateCode: 'KA' };
    const out = computeGSTForLines(seller, buyer, [
      { description: 'Low price item', amount: 1, type: 'goods', code: '0101' }, // 5%
    ]);
    expect(out.totalTax).toBe(0.05);
    expect(out.cgst + out.sgst).toBe(0.05);
  });

  it('formats INR', () => {
    expect(formatINR(1180)).toContain('₹');
  });
});
