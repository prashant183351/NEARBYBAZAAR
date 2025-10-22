import { encryptSecret, decryptSecret, maskSecret } from '../src/utils/crypto';

describe('crypto utils', () => {
  it('encrypts and decrypts a secret', () => {
    const secret = 'mySecret123';
    const enc = encryptSecret(secret);
    const dec = decryptSecret(enc);
    expect(dec).toBe(secret);
  });

  it('masks secret except last 4 chars', () => {
    expect(maskSecret('abcdef1234')).toBe('****1234');
    expect(maskSecret('')).toBe('');
  });

  it('decryptSecret throws on malformed input', () => {
    expect(() => decryptSecret('bad:input')).toThrow();
  });
});
