ALTER TABLE appointment_payment
  ADD COLUMN IF NOT EXISTS amount_required NUMERIC(12, 2) NOT NULL DEFAULT 0,
  ADD COLUMN IF NOT EXISTS payment_mode VARCHAR(20) NOT NULL DEFAULT 'PAY_LATER';

ALTER TABLE appointment_payment
  ADD CONSTRAINT chk_appointment_payment_required_amount
  CHECK (amount_required >= 0 AND amount_required <= amount_due);

ALTER TABLE appointment_payment
  ADD CONSTRAINT chk_appointment_payment_mode
  CHECK (payment_mode IN ('PAY_LATER', 'DEPOSIT', 'FULL'));

ALTER TABLE appointment
  ADD CONSTRAINT chk_appointment_payment_deadline
  CHECK (payment_required = FALSE OR payment_deadline IS NOT NULL);
