import { addServerWatermark } from '../src/watermark.server';

describe('addServerWatermark', () => {
    it('should return the original buffer (stub)', () => {
        const buf = Buffer.from('test');
        expect(addServerWatermark(buf, 'text')).toBe(buf);
    });
});
