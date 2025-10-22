/**
 * Mock implementation of sharp for tests
 * Avoids needing to install the native sharp module
 */

export default function sharp() {
  return {
    extract: jest.fn().mockReturnThis(),
    toBuffer: jest.fn().mockResolvedValue(Buffer.from('mock-image-data')),
  };
}
