CREATE TABLE IF NOT EXISTS business_hours (
  id UUID PRIMARY KEY,
  tenant_id VARCHAR(255) NOT NULL,
  day_of_week INTEGER NOT NULL,
  enabled BOOLEAN NOT NULL DEFAULT FALSE,
  open_time TIME,
  close_time TIME,
  break_start TIME,
  break_end TIME,
  CONSTRAINT uq_business_hours_tenant_day UNIQUE (tenant_id, day_of_week)
);
CREATE INDEX IF NOT EXISTS idx_business_hours_tenant ON business_hours(tenant_id);

CREATE TABLE IF NOT EXISTS business_holiday (
  id UUID PRIMARY KEY,
  tenant_id VARCHAR(255) NOT NULL,
  holiday_date DATE NOT NULL,
  name VARCHAR(255) NOT NULL
);
CREATE INDEX IF NOT EXISTS idx_business_holiday_tenant_date ON business_holiday(tenant_id, holiday_date);
