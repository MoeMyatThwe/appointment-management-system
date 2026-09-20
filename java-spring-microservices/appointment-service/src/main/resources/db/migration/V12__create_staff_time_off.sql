CREATE TABLE IF NOT EXISTS staff_time_off (
  id UUID PRIMARY KEY,
  tenant_id VARCHAR(255) NOT NULL,
  staff_id VARCHAR(255) NOT NULL,
  start_time VARCHAR(50) NOT NULL,
  end_time VARCHAR(50) NOT NULL,
  reason VARCHAR(500)
);
CREATE INDEX IF NOT EXISTS idx_staff_time_off_lookup
  ON staff_time_off(tenant_id, staff_id, start_time, end_time);
