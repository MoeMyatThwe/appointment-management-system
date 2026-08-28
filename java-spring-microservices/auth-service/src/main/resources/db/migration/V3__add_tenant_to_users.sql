ALTER TABLE users ADD COLUMN IF NOT EXISTS tenant_id VARCHAR(255);
UPDATE users
SET tenant_id = 'default-tenant'
WHERE tenant_id IS NULL;
ALTER TABLE users ALTER COLUMN tenant_id SET NOT NULL;
CREATE INDEX IF NOT EXISTS idx_users_tenant_id ON users (tenant_id);
