import { env } from '../config/env';
import { AppError } from '../shared/errors/app-error';

interface SupabaseUserResponse {
  id: string;
  email?: string;
  user_metadata?: {
    name?: string;
    full_name?: string;
  };
}

export async function verifySupabaseAccessToken(token: string): Promise<{
  id: string;
  email: string | null;
  name: string | null;
}> {
  const response = await fetch(`${env.supabaseUrl}/auth/v1/user`, {
    method: 'GET',
    headers: {
      apikey: env.supabasePublishableKey,
      Authorization: `Bearer ${token}`
    }
  });

  if (!response.ok) {
    throw new AppError(401, 'UNAUTHORIZED', 'Invalid organizer bearer token');
  }

  const user = (await response.json()) as SupabaseUserResponse;

  return {
    id: user.id,
    email: user.email ?? null,
    name: user.user_metadata?.name ?? user.user_metadata?.full_name ?? null
  };
}
