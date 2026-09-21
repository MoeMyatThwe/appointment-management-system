CREATE EXTENSION IF NOT EXISTS pgcrypto;

CREATE TABLE notification_processed_event (
  event_id VARCHAR(255) PRIMARY KEY,
  event_type VARCHAR(100) NOT NULL,
  processed_at TIMESTAMP WITH TIME ZONE NOT NULL
);

CREATE TABLE notification_delivery (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  event_id VARCHAR(255) NOT NULL,
  event_type VARCHAR(100) NOT NULL,
  adapter_name VARCHAR(255) NOT NULL,
  delivered_at TIMESTAMP WITH TIME ZONE NOT NULL,
  CONSTRAINT uq_notification_delivery UNIQUE (event_id, event_type, adapter_name)
);

CREATE TABLE notification_reminder (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  appointment_id VARCHAR(255) NOT NULL UNIQUE,
  event_id VARCHAR(255) NOT NULL,
  payload BYTEA NOT NULL,
  scheduled_at TIMESTAMP WITH TIME ZONE NOT NULL,
  status VARCHAR(20) NOT NULL,
  attempts INTEGER NOT NULL DEFAULT 0,
  claimed_until TIMESTAMP WITH TIME ZONE,
  created_at TIMESTAMP WITH TIME ZONE NOT NULL,
  sent_at TIMESTAMP WITH TIME ZONE
);

CREATE INDEX idx_notification_reminder_due
  ON notification_reminder(status, scheduled_at);
