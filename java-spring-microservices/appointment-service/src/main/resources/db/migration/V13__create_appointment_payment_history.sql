CREATE TABLE IF NOT EXISTS appointment_payment_history (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  tenant_id VARCHAR(255) NOT NULL,
  appointment_id UUID NOT NULL,
  amount NUMERIC(12, 2) NOT NULL,
  type VARCHAR(30) NOT NULL,
  payment_method VARCHAR(30),
  status VARCHAR(30) NOT NULL,
  created_at VARCHAR(50) NOT NULL
);
CREATE INDEX IF NOT EXISTS idx_payment_history_appointment
  ON appointment_payment_history(tenant_id, appointment_id, created_at);
