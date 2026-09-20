ALTER TABLE staff
  ADD COLUMN IF NOT EXISTS active BOOLEAN NOT NULL DEFAULT TRUE;

CREATE INDEX IF NOT EXISTS idx_staff_tenant_active
  ON staff(tenant_id, active);
