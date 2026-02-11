import { Router } from 'express';

import {
  guestCompleteUpload,
  guestCreateUpload,
  guestGetMySession,
  guestGetMyUploads,
  guestJoinEvent,
  guestLookupEvent,
  guestPatchMySession
} from './guest.controller';

const guestRouter = Router();

guestRouter.post('/lookup-event', guestLookupEvent);
guestRouter.post('/join', guestJoinEvent);
guestRouter
  .route('/my-session')
  .get(guestGetMySession)
  .patch(guestPatchMySession);
guestRouter.post('/create-upload', guestCreateUpload);
guestRouter.post('/complete-upload', guestCompleteUpload);
guestRouter.get('/my-uploads', guestGetMyUploads);

export { guestRouter };
