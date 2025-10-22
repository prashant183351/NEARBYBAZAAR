export function formatCurrency(
  amount: number,
  locale: string = 'en-IN',
  currency: string = 'INR',
): string {
  return new Intl.NumberFormat(locale, { style: 'currency', currency }).format(amount);
}
