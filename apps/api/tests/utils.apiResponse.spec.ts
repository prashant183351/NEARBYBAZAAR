import { apiSuccess, apiError } from '../src/utils/apiResponse';

describe('apiResponse', () => {
  it('returns a success envelope', () => {
    const data = { foo: 'bar' };
    expect(apiSuccess(data)).toEqual({ success: true, data });
  });
  it('returns an error envelope', () => {
    const err = apiError('fail', 'E_FAIL', { detail: 1 });
    expect(err).toEqual({
      success: false,
      error: { message: 'fail', code: 'E_FAIL', details: { detail: 1 } },
    });
  });
  it('returns error with only message', () => {
    expect(apiError('fail')).toEqual({ success: false, error: { message: 'fail' } });
  });
});
