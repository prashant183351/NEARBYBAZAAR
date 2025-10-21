// Minimal RBAC guard stub for admin plans route
export function rbacGuard() {
  return (_req: any, _res: any, next: any) => {
    // Allow all for now
    next();
  };
}
