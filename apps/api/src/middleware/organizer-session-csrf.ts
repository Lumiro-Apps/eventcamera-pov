import type { NextFunction, Request, Response } from 'express';

import { env } from '../config/env';
import { ORGANIZER_SESSION_COOKIE_NAME } from '../modules/organizer/organizer-session';
import { AppError } from '../shared/errors/app-error';

const CSRF_PROTECTED_METHODS = new Set(['POST', 'PATCH', 'PUT', 'DELETE']);

function normalizeOrigin(value: string): string | null {
  try {
    return new URL(value).origin;
  } catch {
    return null;
  }
}

function resolveRequestOrigin(req: Request): string | null {
  const originHeader = req.header('origin');
  if (originHeader) {
    return normalizeOrigin(originHeader);
  }

  const refererHeader = req.header('referer');
  if (refererHeader) {
    return normalizeOrigin(refererHeader);
  }

  return null;
}

function isLocalHostname(hostname: string): boolean {
  const lower = hostname.toLowerCase();
  return lower === 'localhost' || lower === '127.0.0.1' || lower === '::1';
}

function isTrustedOrigin(origin: string): boolean {
  let parsed: URL;
  try {
    parsed = new URL(origin);
  } catch {
    return false;
  }

  if (isLocalHostname(parsed.hostname)) {
    return true;
  }

  return env.corsAllowedOrigins.some((allowedOrigin) => {
    const normalized = normalizeOrigin(allowedOrigin);
    return normalized === origin;
  });
}

function hasBearerAuth(req: Request): boolean {
  const authorization = req.header('authorization');
  if (!authorization) return false;

  const [scheme, token] = authorization.split(' ');
  return scheme?.toLowerCase() === 'bearer' && Boolean(token?.trim());
}

function shouldEnforceCsrf(req: Request): boolean {
  if (!CSRF_PROTECTED_METHODS.has(req.method.toUpperCase())) {
    return false;
  }

  if (req.organizer?.auth_method === 'bearer') {
    return false;
  }

  if (hasBearerAuth(req)) {
    return false;
  }

  if (req.organizer?.auth_method === 'session') {
    return true;
  }

  const cookieToken = req.cookies?.[ORGANIZER_SESSION_COOKIE_NAME];
  return typeof cookieToken === 'string' && cookieToken.trim().length > 0;
}

export function organizerSessionCsrfMiddleware(
  req: Request,
  _res: Response,
  next: NextFunction
): void {
  if (!shouldEnforceCsrf(req)) {
    next();
    return;
  }

  const requestOrigin = resolveRequestOrigin(req);
  if (!requestOrigin || !isTrustedOrigin(requestOrigin)) {
    next(
      new AppError(403, 'CSRF_CHECK_FAILED', 'CSRF check failed for organizer session request')
    );
    return;
  }

  next();
}
