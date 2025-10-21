import { addClientWatermark } from '../src/watermark.client';

describe('addClientWatermark', () => {
    it('should return the original image URL (stub)', () => {
        expect(addClientWatermark('url', 'text')).toBe('url');
    });
});
