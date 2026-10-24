import { parseOrigins } from './config';

describe('parseOrigins', () => {
  test('defaults to localhost:4200', () => {
    expect(parseOrigins(undefined)).toEqual(['http://localhost:4200']);
    expect(parseOrigins('  ')).toEqual(['http://localhost:4200']);
  });
  test('splits and trims a comma-separated list', () => {
    expect(parseOrigins('https://a.com, https://b.com')).toEqual([
      'https://a.com',
      'https://b.com',
    ]);
  });
});
