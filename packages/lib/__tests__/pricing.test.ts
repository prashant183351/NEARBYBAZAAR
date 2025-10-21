import { calculateDiscountedPrice, formatPrice } from '../src/pricing';

describe('Pricing functions', () => {
    it('should calculate discounted price', () => {
        expect(calculateDiscountedPrice(100, 10)).toBe(90);
    });
    it('should format price', () => {
        expect(formatPrice(100)).toContain('₹');
    });
});
