import { query } from '../lib/db';

const OPEN_EARLY_HOURS = 13;
const CLOSE_LATE_HOURS = 13;

interface CountRow {
  count: number;
}

export interface EventStatusSyncResult {
  activated: number;
  closed: number;
  open_buffer_hours: number;
  close_buffer_hours: number;
  executed_at: string;
}

function millisecondsUntilNextUtcHalfDayBoundary(anchor: Date = new Date()): number {
  const year = anchor.getUTCFullYear();
  const month = anchor.getUTCMonth();
  const day = anchor.getUTCDate();
  const hour = anchor.getUTCHours();

  const nextBoundaryMs =
    hour < 12
      ? Date.UTC(year, month, day, 12, 0, 0, 0)
      : Date.UTC(year, month, day + 1, 0, 0, 0, 0);

  return Math.max(nextBoundaryMs - anchor.getTime(), 1_000);
}

async function updateToActive(): Promise<number> {
  const result = await query<CountRow>(
    `
      WITH updated AS (
        UPDATE events
        SET status = 'active'
        WHERE status = 'draft'
          AND now() >= ((event_date::timestamp AT TIME ZONE 'UTC') - ($1::int * INTERVAL '1 hour'))
          AND now() <= (
            ((end_date::timestamp AT TIME ZONE 'UTC') + INTERVAL '1 day') +
            ($2::int * INTERVAL '1 hour')
          )
        RETURNING 1
      )
      SELECT COUNT(*)::int AS count
      FROM updated
    `,
    [OPEN_EARLY_HOURS, CLOSE_LATE_HOURS]
  );

  return result.rows[0]?.count ?? 0;
}

async function updateToClosed(): Promise<number> {
  const result = await query<CountRow>(
    `
      WITH updated AS (
        UPDATE events
        SET status = 'closed'
        WHERE status IN ('draft', 'active')
          AND now() > (
            ((end_date::timestamp AT TIME ZONE 'UTC') + INTERVAL '1 day') +
            ($1::int * INTERVAL '1 hour')
          )
        RETURNING 1
      )
      SELECT COUNT(*)::int AS count
      FROM updated
    `,
    [CLOSE_LATE_HOURS]
  );

  return result.rows[0]?.count ?? 0;
}

export async function runEventStatusSyncOnce(): Promise<EventStatusSyncResult> {
  const [activated, closed] = await Promise.all([updateToActive(), updateToClosed()]);
  return {
    activated,
    closed,
    open_buffer_hours: OPEN_EARLY_HOURS,
    close_buffer_hours: CLOSE_LATE_HOURS,
    executed_at: new Date().toISOString()
  };
}

export function startEventStatusCron(): void {
  const runAndLog = () => {
    void runEventStatusSyncOnce()
      .then((result) => {
        console.log(
          `[cron] event status sync complete: activated=${result.activated}, closed=${result.closed}, open_buffer_hours=${result.open_buffer_hours}, close_buffer_hours=${result.close_buffer_hours}`
        );
      })
      .catch((error) => {
        console.error('[cron] event status sync failed', error);
      });
  };

  const scheduleNextRun = () => {
    const delay = millisecondsUntilNextUtcHalfDayBoundary();

    setTimeout(() => {
      runAndLog();
      scheduleNextRun();
    }, delay);
  };

  console.log(
    '[cron] event status sync scheduled every 12 hours at 00:00 and 12:00 UTC'
  );
  scheduleNextRun();
}
