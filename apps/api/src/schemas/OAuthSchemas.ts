import { z } from 'zod';

export const OAuthSchema = {
  tokenRequest: z.object({
    client_id: z.string(),
    client_secret: z.string(),
  }),
  revokeRequest: z.object({
    token: z.string(),
  }),
};
