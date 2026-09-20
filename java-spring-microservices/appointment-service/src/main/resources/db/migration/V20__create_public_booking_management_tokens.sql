CREATE TABLE IF NOT EXISTS public_booking_tokens (
  id UUID PRIMARY KEY,
  tenant_id VARCHAR(255) NOT NULL,
  appointment_id UUID NOT NULL,
  token_hash VARCHAR(128) NOT NULL UNIQUE,
  created_at TIMESTAMP WITH TIME ZONE NOT NULL,
  expires_at TIMESTAMP WITH TIME ZONE NOT NULL,
  revoked_at TIMESTAMP WITH TIME ZONE
);

CREATE UNIQUE INDEX IF NOT EXISTS uq_public_booking_token_appointment
  ON public_booking_tokens(appointment_id, tenant_id)
  WHERE revoked_at IS NULL;

CREATE INDEX IF NOT EXISTS idx_public_booking_token_lookup
  ON public_booking_tokens(tenant_id, token_hash);
