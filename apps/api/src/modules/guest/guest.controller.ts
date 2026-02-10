import type { NextFunction, Request, Response } from 'express';

import { AppError } from '../../shared/errors/app-error';
import { guestService } from './guest.service';

const DEVICE_SESSION_COOKIE_NAME = 'device_session_token';
const DEVICE_SESSION_COOKIE_MAX_AGE_MS = 7 * 24 * 60 * 60 * 1000; // 7 days

function getDeviceSessionToken(req: Request): string {
  const token = req.cookies?.[DEVICE_SESSION_COOKIE_NAME];
  if (typeof token !== 'string' || !token.trim()) {
    throw new AppError(401, 'UNAUTHORIZED', 'Guest session cookie is missing');
  }

  return token.trim();
}

function setDeviceSessionCookie(res: Response, deviceSessionToken: string): void {
  res.cookie(DEVICE_SESSION_COOKIE_NAME, deviceSessionToken, {
    httpOnly: true,
    secure: process.env.NODE_ENV === 'production',
    sameSite: 'strict',
    path: '/api',
    maxAge: DEVICE_SESSION_COOKIE_MAX_AGE_MS
  });
}

function asyncHandler(
  handler: (req: Request, res: Response) => Promise<void>
): (req: Request, res: Response, next: NextFunction) => void {
  return (req, res, next) => {
    void handler(req, res).catch(next);
  };
}

export const guestJoinEvent = asyncHandler(async (req, res) => {
  const payload = await guestService.joinEvent(req.body);
  setDeviceSessionCookie(res, payload.device_session_token);
  res.status(200).json(payload.response);
});

export const guestGetMySession = asyncHandler(async (req, res) => {
  const token = getDeviceSessionToken(req);
  const payload = await guestService.getMySession(token);
  res.status(200).json(payload);
});

export const guestPatchMySession = asyncHandler(async (req, res) => {
  const token = getDeviceSessionToken(req);
  const payload = await guestService.patchMySession(token, req.body);
  res.status(200).json(payload);
});

export const guestCreateUpload = asyncHandler(async (req, res) => {
  const token = getDeviceSessionToken(req);
  const payload = await guestService.createUpload(token, req.body);
  res.status(200).json(payload);
});

export const guestCompleteUpload = asyncHandler(async (req, res) => {
  const token = getDeviceSessionToken(req);
  const payload = await guestService.completeUpload(token, req.body);
  res.status(200).json(payload);
});

export const guestGetMyUploads = asyncHandler(async (req, res) => {
  const token = getDeviceSessionToken(req);
  const payload = await guestService.getMyUploads(token);
  res.status(200).json(payload);
});
