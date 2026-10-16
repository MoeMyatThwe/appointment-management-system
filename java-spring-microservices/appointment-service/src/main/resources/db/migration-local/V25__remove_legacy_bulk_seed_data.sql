CREATE TEMP TABLE legacy_seed_appointments ON COMMIT DROP AS
SELECT a.id
FROM appointment a
JOIN customer c ON c.id::text = a.customer_id
WHERE c.name = 'Demo Customer'
   OR c.name = 'Probe Customer'
   OR c.email LIKE 'simple.customer%@gmail.com';

DELETE FROM appointment_payment_history
WHERE appointment_id::text IN (SELECT id::text FROM legacy_seed_appointments);

DELETE FROM appointment_refund
WHERE appointment_id::text IN (SELECT id::text FROM legacy_seed_appointments);

DELETE FROM appointment_payment
WHERE appointment_id::text IN (SELECT id::text FROM legacy_seed_appointments);

DELETE FROM appointment_status_history
WHERE appointment_id::text IN (SELECT id::text FROM legacy_seed_appointments);

DELETE FROM public_booking_tokens
WHERE appointment_id::text IN (SELECT id::text FROM legacy_seed_appointments);

DELETE FROM appointment_event_outbox
WHERE aggregate_id IN (SELECT id::text FROM legacy_seed_appointments);

DELETE FROM appointment_idempotency_keys
WHERE appointment_id::text IN (SELECT id::text FROM legacy_seed_appointments);

DELETE FROM appointment
WHERE id::text IN (SELECT id::text FROM legacy_seed_appointments);

DELETE FROM staff_time_off
WHERE staff_id::text IN (
  SELECT id::text
  FROM staff
  WHERE name LIKE 'Seed Team Member %'
);

DELETE FROM customer
WHERE name = 'Demo Customer'
   OR name = 'Probe Customer'
   OR email LIKE 'simple.customer%@gmail.com';

DELETE FROM staff
WHERE name LIKE 'Seed Team Member %';

DELETE FROM service_offering
WHERE name LIKE 'Seed Service %';

DELETE FROM bookable_resource
WHERE name LIKE 'Treatment Room %'
   OR name LIKE 'Styling Station %'
   OR name LIKE 'Consultation Desk %'
   OR name LIKE 'Massage Table %';
