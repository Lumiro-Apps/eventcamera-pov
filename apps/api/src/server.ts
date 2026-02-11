import { app } from './app';
import { env } from './config/env';
import { startEventStatusCron } from './cron/event-status-cron';

app.listen(env.port, () => {
  console.log(`POV EventCamera API listening on port ${env.port}`);

  if (env.enableCronJobs) {
    startEventStatusCron();
  }
});
