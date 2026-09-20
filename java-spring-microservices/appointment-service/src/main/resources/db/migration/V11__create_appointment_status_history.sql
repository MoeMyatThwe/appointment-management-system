CREATE TABLE IF NOT EXISTS appointment_status_history (
  id UUID PRIMARY KEY,
  tenant_id VARCHAR(255) NOT NULL,
  appointment_id UUID NOT NULL,
  changed_by VARCHAR(255) NOT NULL,
  changed_at TIMESTAMP WITH TIME ZONE NOT NULL,
  previous_status VARCHAR(30) NOT NULL,
  new_status VARCHAR(30) NOT NULL,
  reason VARCHAR(500)
);
CREATE INDEX IF NOT EXISTS idx_appointment_status_history_appointment
  ON appointment_status_history(tenant_id, appointment_id, changed_at DESC);
