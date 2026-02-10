import { Router } from 'express';

import { paymentWebhook } from './webhooks.controller';

const webhooksRouter = Router();

webhooksRouter.post('/payment', paymentWebhook);

export { webhooksRouter };
