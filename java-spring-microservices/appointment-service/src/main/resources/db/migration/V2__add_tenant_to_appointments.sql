ALTER TABLE appointment ADD COLUMN IF NOT EXISTS tenant_id VARCHAR(255);
UPDATE appointment
SET tenant_id = 'default-tenant'
WHERE tenant_id IS NULL;
ALTER TABLE appointment ALTER COLUMN tenant_id SET NOT NULL;
CREATE INDEX IF NOT EXISTS idx_appointment_tenant_id ON appointment (tenant_id);
