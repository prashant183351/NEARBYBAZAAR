import { logger } from '../src/utils/logger';

describe('logger', () => {
  it('calls console.info for info', () => {
    const spy = jest.spyOn(console, 'info').mockImplementation(() => {});
    logger.info('test info');
    expect(spy).toHaveBeenCalledWith('[INFO]', 'test info');
    spy.mockRestore();
  });
  it('calls console.warn for warn', () => {
    const spy = jest.spyOn(console, 'warn').mockImplementation(() => {});
    logger.warn('test warn');
    expect(spy).toHaveBeenCalledWith('[WARN]', 'test warn');
    spy.mockRestore();
  });
  it('calls console.error for error', () => {
    const spy = jest.spyOn(console, 'error').mockImplementation(() => {});
    logger.error('test error');
    expect(spy).toHaveBeenCalledWith('[ERROR]', 'test error');
    spy.mockRestore();
  });
});
