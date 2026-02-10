import type { NextFunction, Request, Response } from 'express';

import { AppError } from '../shared/errors/app-error';

export function notFoundMiddleware(
  req: Request,
  _res: Response,
  next: NextFunction
): void {
  next(
    new AppError(404, 'NOT_FOUND', `Route ${req.method} ${req.originalUrl} was not found`)
  );
}
