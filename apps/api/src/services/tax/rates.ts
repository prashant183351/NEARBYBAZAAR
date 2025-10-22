export type GSTRate = {
  code: string; // HSN or SAC
  rate: number; // percentage (e.g., 18 for 18%)
  type: 'HSN' | 'SAC';
  description?: string;
};

// Minimal sample mapping; expand via DB/seed later
const RATES: GSTRate[] = [
  { code: '0101', rate: 5, type: 'HSN', description: 'Live horses' },
  { code: '1001', rate: 0, type: 'HSN', description: 'Wheat' },
  { code: '2106', rate: 12, type: 'HSN', description: 'Food preparations' },
  { code: '3004', rate: 12, type: 'HSN', description: 'Medicaments' },
  { code: '8517', rate: 18, type: 'HSN', description: 'Phones' },
  { code: '9983', rate: 18, type: 'SAC', description: 'Other professional services' },
  { code: '9965', rate: 5, type: 'SAC', description: 'Transport services' },
];

export function getRateByHSN(hsn: string): number | null {
  const found = RATES.find((r) => r.type === 'HSN' && r.code === hsn);
  return found ? found.rate : null;
}

export function getRateBySAC(sac: string): number | null {
  const found = RATES.find((r) => r.type === 'SAC' && r.code === sac);
  return found ? found.rate : null;
}

export function getDefaultRate(): number {
  // Fallback default
  return 18;
}
