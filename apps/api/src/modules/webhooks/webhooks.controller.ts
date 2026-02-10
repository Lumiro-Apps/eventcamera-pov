import type { Request, Response } from 'express';

import { sendNotImplemented } from '../../shared/http/send-not-implemented';

export function paymentWebhook(req: Request, res: Response): void {
  sendNotImplemented(res, 'paymentWebhook', req.requestId);
}
