-- Add support for downloading selected media items

-- Add media_ids column to store selected media for download_selected jobs
ALTER TABLE organizer_jobs ADD COLUMN IF NOT EXISTS media_ids UUID[];

-- Update the job_type constraint to include 'download_selected'
ALTER TABLE organizer_jobs DROP CONSTRAINT IF EXISTS organizer_jobs_job_type_check;
ALTER TABLE organizer_jobs ADD CONSTRAINT organizer_jobs_job_type_check
  CHECK (job_type IN ('download_all', 'download_selected'));

-- Create index for faster lookup when filtering by media_ids
CREATE INDEX IF NOT EXISTS idx_organizer_jobs_media_ids
  ON organizer_jobs USING GIN (media_ids) WHERE media_ids IS NOT NULL;
