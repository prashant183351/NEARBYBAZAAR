import { errorHandler } from '../src/utils/errors';

describe('errorHandler', () => {
  it('logs error and sends 500', () => {
    const err = new Error('fail');
    const req = {} as any;
    const res = { status: jest.fn().mockReturnThis(), json: jest.fn() } as any;
    const next = jest.fn();
    const spy = jest.spyOn(console, 'error').mockImplementation(() => {});
    errorHandler(err, req, res, next);
    expect(spy).toHaveBeenCalledWith(err);
    expect(res.status).toHaveBeenCalledWith(500);
    expect(res.json).toHaveBeenCalledWith({ error: 'Internal Server Error' });
    spy.mockRestore();
  });
});
