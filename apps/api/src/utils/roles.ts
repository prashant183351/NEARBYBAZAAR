export function mapRolesToScopes(roles: string[]): string[] {
  const roleScopeMap: { [key: string]: string[] } = {
    admin: ['orders.read', 'users.write', 'products.write'],
    vendor: ['orders.read', 'products.write'],
    buyer: ['orders.read'],
    b2bbuyer: ['orders.read', 'rfq.submit'],
    erp: ['inventory.read', 'orders.write'],
  };

  const scopes = new Set<string>();
  roles.forEach((role: string) => {
    if (roleScopeMap[role]) {
      roleScopeMap[role].forEach((scope: string) => scopes.add(scope));
    }
  });

  return Array.from(scopes);
}
