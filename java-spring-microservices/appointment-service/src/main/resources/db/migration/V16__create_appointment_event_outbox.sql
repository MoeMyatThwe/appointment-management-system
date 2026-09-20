CREATE TABLE IF NOT EXISTS appointment_event_outbox (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  aggregate_id VARCHAR(255) NOT NULL,
  event_type VARCHAR(100) NOT NULL,
  payload BYTEA NOT NULL,
  status VARCHAR(20) NOT NULL DEFAULT 'PENDING',
  attempts INTEGER NOT NULL DEFAULT 0,
  created_at VARCHAR(50) NOT NULL,
  published_at VARCHAR(50),
  last_error VARCHAR(1000)
);
CREATE INDEX IF NOT EXISTS idx_appointment_event_outbox_pending
  ON appointment_event_outbox(status, created_at);
