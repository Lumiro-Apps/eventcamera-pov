import type { Response } from 'express';

export function sendNotImplemented(
  res: Response,
  operationId: string,
  requestId?: string
): void {
  res.status(501).json({
    error: {
      code: 'NOT_IMPLEMENTED',
      message: 'Endpoint scaffolded but not implemented yet.',
      request_id: requestId ?? null,
      details: {
        operation_id: operationId
      }
    }
  });
}
