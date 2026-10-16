ALTER TABLE customer
  ADD COLUMN IF NOT EXISTS customer_account_id UUID;

CREATE UNIQUE INDEX IF NOT EXISTS uq_customer_account_tenant
  ON customer(tenant_id, customer_account_id)
  WHERE customer_account_id IS NOT NULL;

ALTER TABLE appointment
  ADD COLUMN IF NOT EXISTS booking_hold_expires_at TIMESTAMP WITH TIME ZONE,
  ADD COLUMN IF NOT EXISTS payment_deadline TIMESTAMP WITH TIME ZONE,
  ADD COLUMN IF NOT EXISTS payment_required BOOLEAN NOT NULL DEFAULT FALSE;

CREATE INDEX IF NOT EXISTS idx_appointment_booking_hold
  ON appointment(tenant_id, booking_hold_expires_at)
  WHERE booking_hold_expires_at IS NOT NULL;

CREATE TABLE IF NOT EXISTS booking_payment_policy (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  tenant_id VARCHAR(255) NOT NULL UNIQUE,
  payment_mode VARCHAR(20) NOT NULL DEFAULT 'PAY_LATER',
  deposit_percent NUMERIC(5, 2) NOT NULL DEFAULT 0,
  cancellation_window_minutes INTEGER NOT NULL DEFAULT 1440,
  refundable_percent NUMERIC(5, 2) NOT NULL DEFAULT 100,
  currency VARCHAR(3) NOT NULL DEFAULT 'USD',
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT CURRENT_TIMESTAMP,
  updated_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT CURRENT_TIMESTAMP,
  CONSTRAINT chk_booking_payment_mode
    CHECK (payment_mode IN ('PAY_LATER', 'DEPOSIT', 'FULL')),
  CONSTRAINT chk_booking_deposit_percent
    CHECK (deposit_percent >= 0 AND deposit_percent <= 100),
  CONSTRAINT chk_booking_refundable_percent
    CHECK (refundable_percent >= 0 AND refundable_percent <= 100),
  CONSTRAINT chk_booking_cancellation_window
    CHECK (cancellation_window_minutes >= 0)
);

ALTER TABLE appointment_payment
  ADD COLUMN IF NOT EXISTS amount_refunded NUMERIC(12, 2) NOT NULL DEFAULT 0,
  ADD COLUMN IF NOT EXISTS refund_status VARCHAR(30) NOT NULL DEFAULT 'NOT_REFUNDED',
  ADD COLUMN IF NOT EXISTS payment_expires_at TIMESTAMP WITH TIME ZONE;

ALTER TABLE appointment_payment
  ADD CONSTRAINT chk_appointment_payment_refund_amount
  CHECK (amount_refunded >= 0 AND amount_refunded <= amount_paid);

ALTER TABLE appointment_payment
  ADD CONSTRAINT chk_appointment_payment_refund_status
  CHECK (refund_status IN ('NOT_REFUNDED', 'PENDING', 'PARTIALLY_REFUNDED', 'REFUNDED', 'FAILED'));

CREATE TABLE IF NOT EXISTS appointment_refund (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  tenant_id VARCHAR(255) NOT NULL,
  appointment_id UUID NOT NULL,
  payment_id UUID NOT NULL,
  amount NUMERIC(12, 2) NOT NULL,
  currency VARCHAR(3) NOT NULL,
  reason VARCHAR(100),
  status VARCHAR(30) NOT NULL DEFAULT 'PENDING',
  stripe_refund_id VARCHAR(255) UNIQUE,
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT CURRENT_TIMESTAMP,
  updated_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT CURRENT_TIMESTAMP,
  CONSTRAINT chk_appointment_refund_amount CHECK (amount > 0),
  CONSTRAINT chk_appointment_refund_status
    CHECK (status IN ('PENDING', 'SUCCEEDED', 'FAILED', 'CANCELED'))
);

CREATE INDEX IF NOT EXISTS idx_appointment_refund_lookup
  ON appointment_refund(tenant_id, appointment_id);

CREATE UNIQUE INDEX IF NOT EXISTS uq_pending_appointment_refund
  ON appointment_refund(payment_id)
  WHERE status = 'PENDING';
