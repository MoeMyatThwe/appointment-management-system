ALTER TABLE appointment ADD COLUMN IF NOT EXISTS resource_id VARCHAR(255);
CREATE INDEX IF NOT EXISTS idx_appointment_tenant_staff_time
  ON appointment(tenant_id, staff_id, start_time, end_time);
CREATE INDEX IF NOT EXISTS idx_appointment_tenant_customer_time
  ON appointment(tenant_id, customer_id, start_time, end_time);
