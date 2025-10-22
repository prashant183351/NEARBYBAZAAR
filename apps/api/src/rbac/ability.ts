import { UserClaims } from '../auth/jwt';

export type Role = UserClaims['role'];
export type Action = 'read' | 'create' | 'update' | 'delete' | 'manage';
export type Resource =
  | 'store'
  | 'product'
  | 'service'
  | 'classified'
  | 'dispute'
  | 'order'
  | 'booking'
  | 'user'
  | 'vendor'
  | 'admin'
  | 'warrantyClaim';

export type AbilityContext = {
  // For create cases (e.g., creating a product for a vendor), compare this id to user.id
  ownerId?: string | null;
  // For existing resources (update/delete), compare the resolved resource owner id
  resourceOwnerId?: string | null;
};

/**
 * Declarative RBAC with optional ownership checks.
 * Rules:
 * - admin: allow all
 * - vendor:
 *    - manage store
 *    - create product/service/classified if ownerId (vendor in payload) matches user.id
 *    - update/delete product/service/classified if resourceOwnerId matches user.id
 * - user:
 *    - read access allowed
 *    - update own user profile
 */
export function can(
  user: UserClaims,
  action: Action,
  resource: Resource,
  ctx: AbilityContext = {},
): boolean {
  const { ownerId, resourceOwnerId } = ctx;

  // Admin can do anything
  if (user.role === 'admin') return true;

  // Public read access only for select resources
  const publicReadResources: Resource[] = ['product', 'service', 'classified', 'store'];
  if (action === 'read' && publicReadResources.includes(resource)) return true;

  const owns = (resourceOwnerId && resourceOwnerId === user.id) || (ownerId && ownerId === user.id);

  if (user.role === 'vendor') {
    if (resource === 'store' && action === 'manage') return true;

    if (
      (resource === 'product' || resource === 'service' || resource === 'classified') &&
      ['create', 'update', 'delete'].includes(action)
    ) {
      return !!owns;
    }

    // Vendor can read/update disputes that belong to them (via vendorId)
    if (resource === 'dispute' && (action === 'read' || action === 'update')) {
      return !!owns; // resourceOwnerId should resolve to vendorId for vendors
    }

    if (resource === 'order' && action === 'read') {
      return !!owns;
    }

    if (resource === 'warrantyClaim' && (action === 'read' || action === 'update')) {
      return !!owns;
    }

    if (resource === 'vendor' && action === 'update') {
      // A vendor can update their own vendor record if ids match
      return !!owns;
    }
  }

  if (user.role === 'user') {
    // A user can update their own user profile
    if (resource === 'user' && action === 'update') {
      return !!(resourceOwnerId && resourceOwnerId === user.id);
    }

    if (resource === 'order' && action === 'read') {
      return !!(resourceOwnerId && resourceOwnerId === user.id);
    }

    // A user (buyer) can create/read/update their own disputes
    if (
      resource === 'dispute' &&
      (action === 'create' || action === 'read' || action === 'update')
    ) {
      return !!owns; // ownerId/resourceOwnerId should resolve to buyerId for users
    }

    if (resource === 'warrantyClaim' && (action === 'create' || action === 'read')) {
      return !!owns;
    }
  }

  return false;
}
