CREATE TABLE IF NOT EXISTS bookable_resource (
  id UUID PRIMARY KEY,
  tenant_id VARCHAR(255) NOT NULL,
  name VARCHAR(255) NOT NULL,
  resource_type VARCHAR(80) NOT NULL,
  description VARCHAR(1000),
  capacity INTEGER NOT NULL DEFAULT 1,
  active BOOLEAN NOT NULL DEFAULT TRUE
);
CREATE INDEX IF NOT EXISTS idx_bookable_resource_tenant ON bookable_resource(tenant_id);

ALTER TABLE service_offering ADD COLUMN IF NOT EXISTS color VARCHAR(20);
