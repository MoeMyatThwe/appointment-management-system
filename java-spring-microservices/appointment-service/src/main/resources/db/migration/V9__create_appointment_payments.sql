CREATE TABLE IF NOT EXISTS appointment_payment (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  tenant_id VARCHAR(255) NOT NULL,
  appointment_id UUID NOT NULL UNIQUE,
  amount_due NUMERIC(12, 2) NOT NULL DEFAULT 0,
  amount_paid NUMERIC(12, 2) NOT NULL DEFAULT 0,
  currency VARCHAR(3) NOT NULL DEFAULT 'USD',
  payment_method VARCHAR(30),
  status VARCHAR(30) NOT NULL DEFAULT 'UNPAID',
  receipt_number VARCHAR(80) NOT NULL UNIQUE,
  created_at VARCHAR(50) NOT NULL,
  updated_at VARCHAR(50) NOT NULL
);
CREATE INDEX IF NOT EXISTS idx_appointment_payment_tenant ON appointment_payment(tenant_id);
