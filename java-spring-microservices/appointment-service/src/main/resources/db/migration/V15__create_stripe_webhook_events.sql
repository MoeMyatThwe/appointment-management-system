CREATE TABLE IF NOT EXISTS stripe_webhook_event (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  event_id VARCHAR(255) NOT NULL UNIQUE,
  event_type VARCHAR(100) NOT NULL,
  processed_at VARCHAR(50) NOT NULL
);
