import { createHash, randomBytes } from 'node:crypto';

import type { CookieOptions, Request, Response } from 'express';

import { env } from '../../config/env';
import { query } from '../../lib/db';
import { verifySupabaseAccessToken } from '../../lib/supabase';
import { AppError } from '../../shared/errors/app-error';

export const ORGANIZER_SESSION_COOKIE_NAME = 'organizer_session_token';

interface OrganizerIdentity {
  id: string;
  email: string | null;
  name: string | null;
}

interface DbOrganizerSessionRow {
  session_id: string;
  organizer_id: string;
  organizer_email: string;
  organizer_name: string;
  expires_at: Date | string;
}

function hashToken(value: string): string {
  return createHash('sha256').update(value).digest('hex');
}

function cookieMaxAgeMs(): number {
  return env.organizerSessionTtlDays * 24 * 60 * 60 * 1000;
}

function toIsoDateTime(value: Date | string): string {
  if (value instanceof Date) {
    return value.toISOString();
  }

  const parsed = new Date(value);
  if (Number.isNaN(parsed.getTime())) {
    return String(value);
  }

  return parsed.toISOString();
}

function getCookieOptions(): CookieOptions {
  const isProduction = env.nodeEnv === 'production';

  return {
    httpOnly: true,
    secure: isProduction,
    sameSite: 'lax',
    path: '/api/organizer',
    maxAge: cookieMaxAgeMs()
  };
}

export function setOrganizerSessionCookie(res: Response, token: string): void {
  res.cookie(ORGANIZER_SESSION_COOKIE_NAME, token, getCookieOptions());
}

export function clearOrganizerSessionCookie(res: Response): void {
  res.clearCookie(ORGANIZER_SESSION_COOKIE_NAME, getCookieOptions());
}

export function getOrganizerSessionTokenFromCookie(req: Request): string | null {
  const token = req.cookies?.[ORGANIZER_SESSION_COOKIE_NAME];
  if (typeof token !== 'string' || !token.trim()) {
    return null;
  }

  return token.trim();
}

function fallbackNameFromEmail(email: string): string {
  const localPart = email.split('@')[0]?.trim();
  return localPart || 'Organizer';
}

export async function ensureOrganizerRow(input: OrganizerIdentity): Promise<void> {
  if (!input.email) {
    throw new AppError(401, 'UNAUTHORIZED', 'Organizer account email is required');
  }

  await query(
    `
      INSERT INTO organizers (id, email, name)
      VALUES ($1::uuid, $2, $3)
      ON CONFLICT (id)
      DO UPDATE SET
        email = EXCLUDED.email,
        name = organizers.name
    `,
    [input.id, input.email, input.name ?? fallbackNameFromEmail(input.email)]
  );
}

export async function createOrganizerSessionFromSupabaseToken(
  bearerToken: string,
  userAgent?: string | null
): Promise<{
  organizer: {
    id: string;
    email: string;
    name: string;
  };
  expires_at: string;
  session_token: string;
}> {
  const identity = await verifySupabaseAccessToken(bearerToken);
  await ensureOrganizerRow(identity);

  if (!identity.email) {
    throw new AppError(401, 'UNAUTHORIZED', 'Organizer account email is required');
  }

  const sessionToken = randomBytes(32).toString('hex');
  const tokenHash = hashToken(sessionToken);

  const insertResult = await query<DbOrganizerSessionRow>(
    `
      INSERT INTO organizer_sessions (
        organizer_id,
        token_hash,
        user_agent,
        expires_at
      )
      VALUES (
        $1::uuid,
        $2,
        $3,
        now() + ($4::int * INTERVAL '1 day')
      )
      RETURNING
        id AS session_id,
        organizer_id,
        $5::text AS organizer_email,
        COALESCE($6::text, $7::text) AS organizer_name,
        expires_at
    `,
    [
      identity.id,
      tokenHash,
      userAgent ?? null,
      env.organizerSessionTtlDays,
      identity.email,
      identity.name,
      fallbackNameFromEmail(identity.email)
    ]
  );

  const row = insertResult.rows[0];
  if (!row) {
    throw new AppError(500, 'DB_WRITE_FAILED', 'Failed to create organizer session');
  }

  return {
    organizer: {
      id: row.organizer_id,
      email: row.organizer_email,
      name: row.organizer_name
    },
    expires_at: toIsoDateTime(row.expires_at),
    session_token: sessionToken
  };
}

export async function resolveOrganizerBySessionToken(sessionToken: string): Promise<{
  organizer: {
    id: string;
    email: string;
    name: string;
  };
  session: {
    id: string;
    expires_at: string;
  };
}> {
  const tokenHash = hashToken(sessionToken);

  const result = await query<DbOrganizerSessionRow>(
    `
      WITH touched AS (
        UPDATE organizer_sessions
        SET last_active_at = now()
        WHERE token_hash = $1
          AND expires_at > now()
        RETURNING id, organizer_id, expires_at
      )
      SELECT
        t.id AS session_id,
        t.organizer_id,
        o.email AS organizer_email,
        o.name AS organizer_name,
        t.expires_at
      FROM touched t
      INNER JOIN organizers o ON o.id = t.organizer_id
      LIMIT 1
    `,
    [tokenHash]
  );

  const row = result.rows[0];
  if (!row) {
    throw new AppError(401, 'UNAUTHORIZED', 'Organizer session is missing, expired, or invalid');
  }

  return {
    organizer: {
      id: row.organizer_id,
      email: row.organizer_email,
      name: row.organizer_name
    },
    session: {
      id: row.session_id,
      expires_at: toIsoDateTime(row.expires_at)
    }
  };
}

export async function revokeOrganizerSessionByToken(sessionToken: string): Promise<void> {
  const tokenHash = hashToken(sessionToken);

  await query(
    `
      DELETE FROM organizer_sessions
      WHERE token_hash = $1
    `,
    [tokenHash]
  );
}
