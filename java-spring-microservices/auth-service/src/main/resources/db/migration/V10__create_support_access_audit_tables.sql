CREATE TABLE IF NOT EXISTS support_access_grants (
  id UUID PRIMARY KEY,
  tenant_id VARCHAR(120) NOT NULL,
  requested_by VARCHAR(255) NOT NULL,
  reason VARCHAR(1000) NOT NULL,
  duration_minutes INTEGER NOT NULL,
  status VARCHAR(30) NOT NULL,
  consented_by VARCHAR(255),
  created_at TIMESTAMP WITH TIME ZONE NOT NULL,
  consented_at TIMESTAMP WITH TIME ZONE,
  expires_at TIMESTAMP WITH TIME ZONE,
  revoked_at TIMESTAMP WITH TIME ZONE
);

CREATE TABLE IF NOT EXISTS platform_audit_events (
  id UUID PRIMARY KEY,
  actor_email VARCHAR(255) NOT NULL,
  actor_role VARCHAR(50) NOT NULL,
  tenant_id VARCHAR(120),
  action VARCHAR(100) NOT NULL,
  details VARCHAR(2000) NOT NULL,
  created_at TIMESTAMP WITH TIME ZONE NOT NULL
);
