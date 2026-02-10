import type { NextFunction, Request, Response } from 'express';

import { query } from '../lib/db';
import { verifySupabaseAccessToken } from '../lib/supabase';
import { AppError } from '../shared/errors/app-error';

function parseBearerToken(headerValue: string | undefined): string | null {
  if (!headerValue) return null;

  const [scheme, token] = headerValue.split(' ');
  if (!scheme || !token) return null;
  if (scheme.toLowerCase() !== 'bearer') return null;
  if (!token.trim()) return null;

  return token.trim();
}

function fallbackNameFromEmail(email: string | null): string {
  if (!email) {
    return 'Organizer';
  }

  const localPart = email.split('@')[0]?.trim();
  return localPart ? localPart : 'Organizer';
}

async function ensureOrganizerRow(input: {
  id: string;
  email: string | null;
  name: string | null;
}): Promise<void> {
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

export function organizerAuthMiddleware(req: Request, _res: Response, next: NextFunction): void {
  const token = parseBearerToken(req.header('authorization'));

  if (!token) {
    next(new AppError(401, 'UNAUTHORIZED', 'Missing organizer bearer token'));
    return;
  }

  void (async () => {
    const user = await verifySupabaseAccessToken(token);
    await ensureOrganizerRow(user);

    req.organizer = {
      id: user.id,
      email: user.email
    };
  })()
    .then(() => next())
    .catch(next);
}
