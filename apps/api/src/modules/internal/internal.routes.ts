import { Router } from 'express';

import { internalEventStatusSync } from './internal.controller';

const internalRouter = Router();

internalRouter.post('/event-status-sync', internalEventStatusSync);

export { internalRouter };
