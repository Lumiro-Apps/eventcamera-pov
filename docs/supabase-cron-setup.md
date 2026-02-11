# Supabase Cron Setup (Call API)

This setup triggers the API endpoint `POST /api/internal/event-status-sync` from Supabase every 12 hours (`00:00` and `12:00` UTC).

## 1) Configure API

Set these in your API environment (for example in Vercel):

```env
ENABLE_CRON_JOBS=false
INTERNAL_CRON_API_TOKEN=<strong-random-token>
```

- `ENABLE_CRON_JOBS=false` disables in-process timers.
- `INTERNAL_CRON_API_TOKEN` protects the internal endpoint.

## 2) Enable required extensions in Supabase SQL editor

```sql
create extension if not exists pg_cron;
create extension if not exists pg_net;
create extension if not exists vault;
```

## 3) Store secrets in Vault

Replace placeholders with your deployed API URL and token.

```sql
select vault.create_secret('https://your-api-domain.com', 'pov_api_base_url');
select vault.create_secret('<same-token-as-INTERNAL_CRON_API_TOKEN>', 'pov_internal_cron_token');
```

## 4) Create the cron job

```sql
select cron.schedule(
  'pov-event-status-sync-12h',
  '0 0,12 * * *',
  $$
  select
    net.http_post(
      url := (select decrypted_secret from vault.decrypted_secrets where name = 'pov_api_base_url')
        || '/api/internal/event-status-sync',
      headers := jsonb_build_object(
        'Content-Type', 'application/json',
        'Authorization', 'Bearer ' || (
          select decrypted_secret
          from vault.decrypted_secrets
          where name = 'pov_internal_cron_token'
        )
      ),
      body := jsonb_build_object(
        'source', 'supabase-cron',
        'scheduled_at', now()
      )
    ) as request_id;
  $$
);
```

## 5) Verify and manage the job

```sql
-- list jobs
select * from cron.job;

-- unschedule if needed
select cron.unschedule('pov-event-status-sync-12h');
```
