import { extractBearerToken } from './extract-bearer-token';

describe('extractBearerToken', () => {
  it('returns token after Bearer prefix', () => {
    const token = extractBearerToken({
      headers: { authorization: 'Bearer abc.def.ghi' },
    });

    expect(token).toBe('abc.def.ghi');
  });

  it('returns empty string when header is missing or invalid', () => {
    expect(extractBearerToken({ headers: {} })).toBe('');
    expect(
      extractBearerToken({ headers: { authorization: 'Basic x' } }),
    ).toBe('');
  });
});
