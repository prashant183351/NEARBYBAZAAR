import { mapRolesToScopes } from '../src/utils/roles';

describe('mapRolesToScopes', () => {
  it('maps admin to all admin scopes', () => {
    expect(mapRolesToScopes(['admin'])).toEqual(
      expect.arrayContaining(['orders.read', 'users.write', 'products.write'])
    );
  });
  it('maps vendor to vendor scopes', () => {
    expect(mapRolesToScopes(['vendor'])).toEqual(
      expect.arrayContaining(['orders.read', 'products.write'])
    );
  });
  it('deduplicates scopes for multiple roles', () => {
    const scopes = mapRolesToScopes(['admin', 'vendor']);
    expect(scopes.filter((v, i, arr) => arr.indexOf(v) !== i).length).toBe(0);
  });
  it('returns empty for unknown role', () => {
    expect(mapRolesToScopes(['unknown'])).toEqual([]);
  });
});
