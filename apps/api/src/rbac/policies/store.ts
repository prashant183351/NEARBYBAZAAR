// Example policy stub
export function canManageStore(user: { role: string }) {
  return user.role === 'admin' || user.role === 'vendor';
}
