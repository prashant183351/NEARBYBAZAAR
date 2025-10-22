import { OAuthClient } from '../models/OAuthClient';
import { OAuthToken } from '../models/OAuthToken';

// Stub missing functions
async function getUserRoles(_userId: string): Promise<string[]> {
  // TODO: Replace with actual user role lookup
  return ['buyer'];
}
function mapRolesToScopes(roles: string[]): string[] {
  // TODO: Replace with actual mapping logic
  return roles.includes('admin') ? ['*'] : ['orders.read', 'profile.read'];
}
function generateAccessToken(): string {
  // TODO: Replace with secure token generation
  return Math.random().toString(36).slice(2) + Date.now();
}
function generateRefreshToken(): string {
  // TODO: Replace with secure token generation
  return Math.random().toString(36).slice(2) + Date.now();
}

export async function issueToken(clientId: string, userId: string, grantType: string) {
  const client = await OAuthClient.findOne({ clientId });
  if (!client) {
    throw new Error('Invalid client');
  }

  let scopes = client.scopes; // Default to client scopes

  if (userId) {
    // Fetch user roles and map to scopes
    const userRoles = await getUserRoles(userId);
    scopes = mapRolesToScopes(userRoles);
  }

  const accessToken = generateAccessToken();
  const refreshToken = grantType === 'refresh_token' ? generateRefreshToken() : null;

  const token = new OAuthToken({
    accessToken,
    refreshToken,
    clientId,
    userId,
    expiresAt: new Date(Date.now() + 3600 * 1000), // 1 hour expiry
    scopes,
  });

  await token.save();
  return token;
}
