INSERT INTO users (
  id, email, password, role, tenant_id, tenant_name, business_type,
  business_phone, timezone, currency, onboarding_completed
)
VALUES (
  '223e4567-e89b-12d3-a456-426614174100',
  'demo.owner@example.com',
  '$2b$12$7hoRZfJrRKD2nIm2vHLs7OBETy.LWenXXMLKf99W8M4PUwO6KB7fu',
  'TENANT_ADMIN',
  'demo-tenant',
  'Harbor Wellness Spa',
  'SPA',
  '+1-555-0100',
  'UTC',
  'USD',
  TRUE
)
ON CONFLICT (email) DO NOTHING;

INSERT INTO customer_accounts (id, email, password, role, active, account_status)
VALUES (
  '323e4567-e89b-12d3-a456-426614174100',
  'demo.customer@example.com',
  '$2b$12$7hoRZfJrRKD2nIm2vHLs7OBETy.LWenXXMLKf99W8M4PUwO6KB7fu',
  'CUSTOMER',
  TRUE,
  'ACTIVE'
)
ON CONFLICT (email) DO NOTHING;
