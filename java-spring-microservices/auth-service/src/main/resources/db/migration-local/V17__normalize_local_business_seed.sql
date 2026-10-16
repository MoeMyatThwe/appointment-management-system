UPDATE users
SET role = 'TENANT_ADMIN'
WHERE email = 'testuser@test.com'
  AND role = 'ADMIN';
