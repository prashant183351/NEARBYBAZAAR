import { can } from './ability';

describe('RBAC can()', () => {
  it('should allow admin to manage store', () => {
    const user = { id: '1', email: 'admin@example.com', role: 'admin' as const };
    expect(can(user, 'manage', 'store')).toBe(true);
  });

  it('should deny user to manage store', () => {
    const user = { id: '2', email: 'user@example.com', role: 'user' as const };
    expect(can(user, 'manage', 'store')).toBe(false);
  });

  it('vendor can create product for own vendor id', () => {
    const user = { id: 'v1', email: 'v@example.com', role: 'vendor' as const };
    expect(can(user, 'create', 'product', { ownerId: 'v1' })).toBe(true);
    expect(can(user, 'create', 'product', { ownerId: 'v2' })).toBe(false);
  });

  it('vendor can update/delete only own product', () => {
    const user = { id: 'v1', email: 'v@example.com', role: 'vendor' as const };
    expect(can(user, 'update', 'product', { resourceOwnerId: 'v1' })).toBe(true);
    expect(can(user, 'delete', 'product', { resourceOwnerId: 'v2' })).toBe(false);
  });

  it('user can update own profile only', () => {
    const user = { id: 'u1', email: 'u@example.com', role: 'user' as const };
    expect(can(user, 'update', 'user', { resourceOwnerId: 'u1' })).toBe(true);
    expect(can(user, 'update', 'user', { resourceOwnerId: 'u2' })).toBe(false);
  });
});
