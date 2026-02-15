import { Router } from 'express';

import { internalDataCleanup, internalEventStatusSync } from './internal.controller';

const internalRouter = Router();

internalRouter.post('/event-status-sync', internalEventStatusSync);
internalRouter.post('/data-cleanup', internalDataCleanup);
internalRouter.post('/media-retention-cleanup', internalDataCleanup);

export { internalRouter };
