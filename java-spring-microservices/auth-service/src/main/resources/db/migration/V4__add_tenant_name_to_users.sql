ALTER TABLE users ADD COLUMN IF NOT EXISTS tenant_name VARCHAR(255);
UPDATE users SET tenant_name = 'Default workspace' WHERE tenant_name IS NULL;
ALTER TABLE users ALTER COLUMN tenant_name SET NOT NULL;
