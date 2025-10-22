import { getEnv } from '../src/utils/secrets';

describe('getEnv', () => {
  const OLD_ENV = process.env;
  beforeEach(() => {
    jest.resetModules();
    process.env = { ...OLD_ENV };
  });
  afterAll(() => {
    process.env = OLD_ENV;
  });

  it('returns the value if present', () => {
    process.env.TEST_KEY = 'value';
    expect(getEnv('TEST_KEY')).toBe('value');
  });

  it('throws if the key is missing', () => {
    delete process.env.TEST_MISSING;
    expect(() => getEnv('TEST_MISSING')).toThrow('Missing env var: TEST_MISSING');
  });
});
