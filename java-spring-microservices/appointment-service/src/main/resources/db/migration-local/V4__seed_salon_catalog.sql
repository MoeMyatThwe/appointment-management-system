INSERT INTO customer (id, tenant_id, name, email, phone, notes)
VALUES ('10000000-0000-0000-0000-000000000001','default-tenant','Demo Customer','demo@example.com','555-0100','Local demo')
ON CONFLICT DO NOTHING;
INSERT INTO staff (id, tenant_id, name, email, role)
VALUES ('20000000-0000-0000-0000-000000000001','default-tenant','Alex Stylist','alex@example.com','Stylist')
ON CONFLICT DO NOTHING;
INSERT INTO service_offering (id, tenant_id, name, duration_minutes, price)
VALUES ('30000000-0000-0000-0000-000000000001','default-tenant','Classic Haircut',45,'35')
ON CONFLICT DO NOTHING;
