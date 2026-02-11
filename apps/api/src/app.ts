import cookieParser from 'cookie-parser';
import cors from 'cors';
import express from 'express';

import { errorHandlerMiddleware } from './middleware/error-handler';
import { notFoundMiddleware } from './middleware/not-found';
import { requestIdMiddleware } from './middleware/request-id';
import { guestRouter } from './modules/guest/guest.routes';
import { internalRouter } from './modules/internal/internal.routes';
import { organizerRouter } from './modules/organizer/organizer.routes';
import { webhooksRouter } from './modules/webhooks/webhooks.routes';

const app = express();

app.disable('x-powered-by');
app.use(requestIdMiddleware);
app.use(cors({ origin: true, credentials: true }));
app.use(cookieParser());
app.use(express.json({ limit: '1mb' }));

app.get('/api/health', (req, res) => {
  res.status(200).json({
    ok: true,
    service: 'poveventcam-api',
    request_id: req.requestId
  });
});

app.use('/api', guestRouter);
app.use('/api/organizer', organizerRouter);
app.use('/api/webhooks', webhooksRouter);
app.use('/api/internal', internalRouter);

app.use(notFoundMiddleware);
app.use(errorHandlerMiddleware);

export { app };
