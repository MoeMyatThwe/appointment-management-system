INSERT INTO customer (id, tenant_id, name, email, phone, notes, customer_account_id)
VALUES (
  '423e4567-e89b-12d3-a456-426614174100',
  'demo-tenant',
  'Demo Customer',
  'demo.customer@example.com',
  '+1-555-0101',
  'Demonstration customer account',
  '323e4567-e89b-12d3-a456-426614174100'
)
ON CONFLICT (id) DO NOTHING;

INSERT INTO staff (id, tenant_id, name, email, role)
VALUES (
  '523e4567-e89b-12d3-a456-426614174100',
  'demo-tenant',
  'Jordan Lee',
  'jordan.lee@example.com',
  'Massage Therapist'
)
ON CONFLICT (id) DO NOTHING;

INSERT INTO service_offering (id, tenant_id, name, duration_minutes, price, color)
VALUES (
  '623e4567-e89b-12d3-a456-426614174100',
  'demo-tenant',
  'Relaxation Massage',
  60,
  '85.00',
  '#7C3AED'
)
ON CONFLICT (id) DO NOTHING;

INSERT INTO bookable_resource (
  id, tenant_id, name, resource_type, description, capacity, active
)
VALUES (
  '723e4567-e89b-12d3-a456-426614174100',
  'demo-tenant',
  'Wellness Room 01',
  'ROOM',
  'Demonstration treatment room.',
  1,
  TRUE
)
ON CONFLICT (id) DO NOTHING;
