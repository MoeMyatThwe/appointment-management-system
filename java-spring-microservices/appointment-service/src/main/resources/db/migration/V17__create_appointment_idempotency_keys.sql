CREATE TABLE IF NOT EXISTS appointment_idempotency_keys (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  tenant_id VARCHAR(255) NOT NULL,
  idempotency_key VARCHAR(128) NOT NULL,
  appointment_id UUID NOT NULL,
  created_at VARCHAR(50) NOT NULL,
  CONSTRAINT uq_appointment_idempotency_tenant_key UNIQUE (tenant_id, idempotency_key)
);

CREATE INDEX IF NOT EXISTS idx_appointment_idempotency_appointment
  ON appointment_idempotency_keys(tenant_id, appointment_id);
