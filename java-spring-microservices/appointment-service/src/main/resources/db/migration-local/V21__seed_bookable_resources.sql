INSERT INTO bookable_resource (id, tenant_id, name, resource_type, description, capacity, active)
VALUES
  ('50000000-0000-0000-0000-000000000001', 'default-tenant', 'Treatment Room 01', 'ROOM', 'Private room for consultations and treatments.', 1, true),
  ('50000000-0000-0000-0000-000000000002', 'default-tenant', 'Treatment Room 02', 'ROOM', 'Private room with adjustable treatment bed.', 1, true),
  ('50000000-0000-0000-0000-000000000003', 'default-tenant', 'Treatment Room 03', 'ROOM', 'Quiet room for longer appointments.', 1, true),
  ('50000000-0000-0000-0000-000000000004', 'default-tenant', 'Styling Station 01', 'STATION', 'Mirror station with chair and storage.', 1, true),
  ('50000000-0000-0000-0000-000000000005', 'default-tenant', 'Styling Station 02', 'STATION', 'Mirror station for styling services.', 1, true),
  ('50000000-0000-0000-0000-000000000006', 'default-tenant', 'Styling Station 03', 'STATION', 'Additional station for peak periods.', 1, true),
  ('50000000-0000-0000-0000-000000000007', 'default-tenant', 'Consultation Desk A', 'LOCATION', 'Desk for intake and consultation appointments.', 2, true),
  ('50000000-0000-0000-0000-000000000008', 'default-tenant', 'Consultation Desk B', 'LOCATION', 'Secondary desk for customer consultations.', 2, true),
  ('50000000-0000-0000-0000-000000000009', 'default-tenant', 'Massage Table 01', 'EQUIPMENT', 'Portable table reserved for massage services.', 1, true),
  ('50000000-0000-0000-0000-000000000010', 'default-tenant', 'Massage Table 02', 'EQUIPMENT', 'Second table for simultaneous bookings.', 1, true)
ON CONFLICT DO NOTHING;
