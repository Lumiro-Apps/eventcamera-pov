import type { NextFunction, Request, Response } from 'express';

import { verifySupabaseAccessToken } from '../lib/supabase';
import {
  ensureOrganizerRow,
  getOrganizerSessionTokenFromCookie,
  resolveOrganizerBySessionToken
} from '../modules/organizer/organizer-session';
import { AppError } from '../shared/errors/app-error';

function parseBearerToken(headerValue: string | undefined): string | null {
  if (!headerValue) return null;

  const [scheme, token] = headerValue.split(' ');
  if (!scheme || !token) return null;
  if (scheme.toLowerCase() !== 'bearer') return null;
  if (!token.trim()) return null;

  return token.trim();
}

export function organizerAuthMiddleware(req: Request, _res: Response, next: NextFunction): void {
  const bearerToken = parseBearerToken(req.header('authorization'));
  const sessionToken = getOrganizerSessionTokenFromCookie(req);

  void (async () => {
    if (bearerToken) {
      const user = await verifySupabaseAccessToken(bearerToken);
      await ensureOrganizerRow(user);

      req.organizer = {
        id: user.id,
        email: user.email,
        name: user.name,
        auth_method: 'bearer',
        session_expires_at: null
      };
      return;
    }

    if (sessionToken) {
      const session = await resolveOrganizerBySessionToken(sessionToken);
      req.organizer = {
        id: session.organizer.id,
        email: session.organizer.email,
        name: session.organizer.name,
        auth_method: 'session',
        session_expires_at: session.session.expires_at
      };
      return;
    }

    throw new AppError(401, 'UNAUTHORIZED', 'Missing organizer authentication');
  })()
    .then(() => next())
    .catch(next);
}
