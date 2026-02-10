import type { NextFunction, Request, Response } from 'express';

import { AppError } from '../shared/errors/app-error';

export function errorHandlerMiddleware(
  err: unknown,
  req: Request,
  res: Response,
  _next: NextFunction
): void {
  if (err instanceof AppError) {
    res.status(err.statusCode).json({
      error: {
        code: err.code,
        message: err.message,
        request_id: req.requestId ?? null,
        details: err.details ?? {}
      }
    });
    return;
  }

  res.status(500).json({
    error: {
      code: 'INTERNAL_SERVER_ERROR',
      message: 'Unexpected server error',
      request_id: req.requestId ?? null,
      details: {}
    }
  });
}
