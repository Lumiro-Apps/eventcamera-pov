import { createOrganizerApiClient } from '@poveventcam/api-client';

function normalizeApiBaseUrl(input: string): string {
  const trimmed = input.trim().replace(/\/+$/, '');
  return trimmed.replace(/\/api$/i, '') || 'http://localhost:3000';
}

const baseUrl = normalizeApiBaseUrl(process.env.NEXT_PUBLIC_API_BASE_URL ?? 'http://localhost:3000');

export const organizerApi = createOrganizerApiClient({
  baseUrl,
  credentials: 'include'
});

interface OrganizerApiSessionPayload {
  organizer: {
    id: string;
    email: string | null;
    name: string | null;
  };
  session: {
    auth_method?: 'bearer' | 'session';
    expires_at: string | null;
  };
}

async function parseAuthSessionResponse(response: Response): Promise<OrganizerApiSessionPayload> {
  if (!response.ok) {
    throw new Error(`Organizer API session request failed (${response.status})`);
  }

  return (await response.json()) as OrganizerApiSessionPayload;
}

export async function createOrganizerApiSession(
  supabaseAccessToken: string
): Promise<OrganizerApiSessionPayload> {
  const response = await fetch(`${baseUrl}/api/organizer/auth/session`, {
    method: 'POST',
    credentials: 'include',
    headers: {
      Authorization: `Bearer ${supabaseAccessToken}`
    }
  });

  return parseAuthSessionResponse(response);
}

export async function getOrganizerApiSession(): Promise<OrganizerApiSessionPayload> {
  const response = await fetch(`${baseUrl}/api/organizer/auth/session`, {
    method: 'GET',
    credentials: 'include'
  });

  return parseAuthSessionResponse(response);
}

export async function clearOrganizerApiSession(): Promise<void> {
  await fetch(`${baseUrl}/api/organizer/auth/session`, {
    method: 'DELETE',
    credentials: 'include'
  });
}
