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

function encodeStoragePath(path: string): string {
  return path
    .split('/')
    .filter(Boolean)
    .map((segment) => encodeURIComponent(segment))
    .join('/');
}

function toAbsoluteStorageUrl(signedPath: string): string {
  if (signedPath.startsWith('http://') || signedPath.startsWith('https://')) {
    return signedPath;
  }

  if (signedPath.startsWith('/storage/v1/')) {
    return `${env.supabaseUrl}${signedPath}`;
  }

  const prefix = signedPath.startsWith('/') ? signedPath : `/${signedPath}`;
  return `${env.supabaseUrl}/storage/v1${prefix}`;
}

function appendTokenToUrl(url: string, token: string): string {
  if (!token || url.includes('token=')) {
    return url;
  }

  const separator = url.includes('?') ? '&' : '?';
  return `${url}${separator}token=${encodeURIComponent(token)}`;
}

function storageSecretHeaders(contentType?: string): HeadersInit {
  const headers: Record<string, string> = {
    apikey: env.supabaseSecretKey
  };

  if (contentType) {
    headers['Content-Type'] = contentType;
  }

  return headers;
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

export async function createSignedStorageObjectUrl(
  bucket: string,
  objectPath: string,
  expiresInSeconds: number = env.signedUrlTtlSeconds
): Promise<string> {
  const encodedPath = encodeStoragePath(objectPath);

  const response = await fetch(
    `${env.supabaseUrl}/storage/v1/object/sign/${encodeURIComponent(bucket)}/${encodedPath}`,
    {
      method: 'POST',
      headers: storageSecretHeaders('application/json'),
      body: JSON.stringify({
        expiresIn: expiresInSeconds
      })
    }
  );

  if (!response.ok) {
    throw new AppError(500, 'STORAGE_SIGN_FAILED', 'Failed to create signed storage URL');
  }

  const payload = (await response.json()) as
    | { signedURL?: string; signedUrl?: string; signed_url?: string }
    | null;

  const signedPath = payload?.signedURL ?? payload?.signedUrl ?? payload?.signed_url;
  if (!signedPath) {
    throw new AppError(500, 'STORAGE_SIGN_FAILED', 'Supabase did not return a signed URL');
  }

  return toAbsoluteStorageUrl(signedPath);
}

export async function createSignedStorageUploadUrl(
  bucket: string,
  objectPath: string,
  expiresInSeconds: number = env.signedUrlTtlSeconds
): Promise<string> {
  const encodedPath = encodeStoragePath(objectPath);

  const response = await fetch(
    `${env.supabaseUrl}/storage/v1/object/upload/sign/${encodeURIComponent(bucket)}/${encodedPath}`,
    {
      method: 'POST',
      headers: storageSecretHeaders('application/json'),
      body: JSON.stringify({
        expiresIn: expiresInSeconds
      })
    }
  );

  if (!response.ok) {
    throw new AppError(500, 'STORAGE_SIGN_FAILED', 'Failed to create signed storage upload URL');
  }

  const payload = (await response.json()) as
    | {
        signedURL?: string;
        signedUrl?: string;
        signed_url?: string;
        url?: string;
        token?: string;
      }
    | null;

  const signedPath =
    payload?.signedURL ??
    payload?.signedUrl ??
    payload?.signed_url ??
    (payload?.url ? appendTokenToUrl(payload.url, payload.token ?? '') : undefined);

  if (!signedPath) {
    throw new AppError(500, 'STORAGE_SIGN_FAILED', 'Supabase did not return a signed upload URL');
  }

  return toAbsoluteStorageUrl(signedPath);
}

export async function doesStorageObjectExist(
  bucket: string,
  objectPath: string
): Promise<boolean> {
  const encodedPath = encodeStoragePath(objectPath);
  const response = await fetch(
    `${env.supabaseUrl}/storage/v1/object/${encodeURIComponent(bucket)}/${encodedPath}`,
    {
      method: 'HEAD',
      headers: storageSecretHeaders()
    }
  );

  if (response.ok) {
    return true;
  }

  if (response.status === 404) {
    return false;
  }

  throw new AppError(500, 'STORAGE_CHECK_FAILED', 'Failed to verify object in Supabase Storage');
}
