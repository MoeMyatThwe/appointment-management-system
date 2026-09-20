ALTER TABLE appointment_payment
  ADD CONSTRAINT chk_appointment_payment_amounts_nonnegative
  CHECK (amount_due >= 0 AND amount_paid >= 0 AND amount_paid <= amount_due);

ALTER TABLE appointment_payment
  ADD CONSTRAINT chk_appointment_payment_status
  CHECK (status IN ('UNPAID', 'PENDING', 'FAILED', 'PARTIALLY_PAID', 'PAID', 'REFUNDED'));

CREATE UNIQUE INDEX IF NOT EXISTS uq_appointment_payment_stripe_session
  ON appointment_payment(stripe_checkout_session_id)
  WHERE stripe_checkout_session_id IS NOT NULL;

CREATE UNIQUE INDEX IF NOT EXISTS uq_appointment_payment_stripe_intent
  ON appointment_payment(stripe_payment_intent_id)
  WHERE stripe_payment_intent_id IS NOT NULL;

ALTER TABLE appointment_payment_history
  ADD CONSTRAINT chk_payment_history_amount_nonnegative
  CHECK (amount >= 0);
