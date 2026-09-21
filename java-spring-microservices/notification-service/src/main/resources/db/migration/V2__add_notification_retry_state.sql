ALTER TABLE notification_processed_event
  ADD COLUMN IF NOT EXISTS status VARCHAR(20) NOT NULL DEFAULT 'PROCESSING';

ALTER TABLE notification_processed_event
  ADD COLUMN IF NOT EXISTS claimed_until TIMESTAMP WITH TIME ZONE;

ALTER TABLE notification_delivery
  ALTER COLUMN delivered_at DROP NOT NULL;

ALTER TABLE notification_delivery
  ADD COLUMN IF NOT EXISTS status VARCHAR(20) NOT NULL DEFAULT 'PROCESSING';

ALTER TABLE notification_delivery
  ADD COLUMN IF NOT EXISTS claimed_until TIMESTAMP WITH TIME ZONE;

ALTER TABLE notification_delivery
  ADD COLUMN IF NOT EXISTS attempts INTEGER NOT NULL DEFAULT 0;

UPDATE notification_processed_event
SET status = 'PROCESSED'
WHERE status = 'PROCESSING' AND processed_at IS NOT NULL;

UPDATE notification_delivery
SET status = 'DELIVERED'
WHERE status = 'PROCESSING' AND delivered_at IS NOT NULL;
