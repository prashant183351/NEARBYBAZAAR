import { can } from '../src/rbac/ability';

describe('RBAC ability rules', () => {
  it('admin can do anything', () => {
    const admin = { id: 'a1', email: 'admin@example.com', role: 'admin' as const };
    expect(can(admin, 'manage', 'store')).toBe(true);
    expect(can(admin, 'delete', 'product')).toBe(true);
  });

  it('vendor can manage store', () => {
    const vendor = { id: 'v1', email: 'v@example.com', role: 'vendor' as const };
    expect(can(vendor, 'manage', 'store')).toBe(true);
  });

  it('vendor can create product only for self', () => {
    const vendor = { id: 'v1', email: 'v@example.com', role: 'vendor' as const };
    expect(can(vendor, 'create', 'product', { ownerId: 'v1' })).toBe(true);
    expect(can(vendor, 'create', 'product', { ownerId: 'v2' })).toBe(false);
  });

  it('vendor can update/delete only own product', () => {
    const vendor = { id: 'v1', email: 'v@example.com', role: 'vendor' as const };
    expect(can(vendor, 'update', 'product', { resourceOwnerId: 'v1' })).toBe(true);
    expect(can(vendor, 'delete', 'product', { resourceOwnerId: 'v2' })).toBe(false);
  });

  it('user can update only own profile', () => {
    const user = { id: 'u1', email: 'u@example.com', role: 'user' as const };
    expect(can(user, 'update', 'user', { resourceOwnerId: 'u1' })).toBe(true);
    expect(can(user, 'update', 'user', { resourceOwnerId: 'u2' })).toBe(false);
  });

  it('deny by default for privileged actions', () => {
    const user = { id: 'u1', email: 'u@example.com', role: 'user' as const };
    expect(can(user, 'delete', 'product')).toBe(false);
  });
});
