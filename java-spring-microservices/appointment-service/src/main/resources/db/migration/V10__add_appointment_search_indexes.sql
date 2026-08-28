CREATE INDEX IF NOT EXISTS idx_appointment_tenant_start_time
  ON appointment(tenant_id, start_time);

CREATE INDEX IF NOT EXISTS idx_appointment_tenant_status_start_time
  ON appointment(tenant_id, status, start_time);

CREATE INDEX IF NOT EXISTS idx_appointment_tenant_staff_start_time
  ON appointment(tenant_id, staff_id, start_time);

CREATE INDEX IF NOT EXISTS idx_appointment_tenant_customer_start_time
  ON appointment(tenant_id, customer_id, start_time);

CREATE INDEX IF NOT EXISTS idx_appointment_tenant_service_start_time
  ON appointment(tenant_id, service_id, start_time);

CREATE INDEX IF NOT EXISTS idx_appointment_tenant_resource_start_time
  ON appointment(tenant_id, resource_id, start_time);
