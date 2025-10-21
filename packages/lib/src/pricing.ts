// Pricing Functions
export function calculateDiscountedPrice(price: number, discount: number): number {
    return Math.max(0, price - (price * discount) / 100);
}

export function formatPrice(price: number, currency: string = 'INR'): string {
    return new Intl.NumberFormat('en-IN', {
        style: 'currency',
        currency,
        maximumFractionDigits: 2,
    }).format(price);
}
