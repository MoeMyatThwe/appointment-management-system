CREATE TABLE IF NOT EXISTS customer (
  id UUID PRIMARY KEY, tenant_id VARCHAR(255) NOT NULL, name VARCHAR(255) NOT NULL,
  email VARCHAR(255) NOT NULL, phone VARCHAR(255), notes VARCHAR(1000)
);
CREATE INDEX IF NOT EXISTS idx_customer_tenant ON customer(tenant_id);
CREATE TABLE IF NOT EXISTS staff (
  id UUID PRIMARY KEY, tenant_id VARCHAR(255) NOT NULL, name VARCHAR(255) NOT NULL,
  email VARCHAR(255), role VARCHAR(255)
);
CREATE INDEX IF NOT EXISTS idx_staff_tenant ON staff(tenant_id);
CREATE TABLE IF NOT EXISTS service_offering (
  id UUID PRIMARY KEY, tenant_id VARCHAR(255) NOT NULL, name VARCHAR(255) NOT NULL,
  duration_minutes INTEGER, price VARCHAR(255)
);
CREATE INDEX IF NOT EXISTS idx_service_tenant ON service_offering(tenant_id);
