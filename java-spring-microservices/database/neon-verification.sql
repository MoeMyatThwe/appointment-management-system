-- Run against the same Neon branch used by AUTH_DATABASE_URL and APPOINTMENT_DATABASE_URL.
-- Flyway creates application tables automatically in the auth and appointment schemas.

SELECT current_database() AS database_name,
       current_schema() AS schema_name,
       current_user AS connected_user;

SELECT schema_name
FROM information_schema.schemata
WHERE schema_name IN ('auth', 'appointment')
ORDER BY schema_name;

SELECT table_schema,
       table_name
FROM information_schema.tables
WHERE table_schema IN ('auth', 'appointment')
ORDER BY table_schema, table_name;

SELECT installed_rank,
       version,
       description,
       success
FROM auth.flyway_schema_history
ORDER BY installed_rank;

SELECT installed_rank,
       version,
       description,
       success
FROM appointment.flyway_schema_history
ORDER BY installed_rank;

SELECT COUNT(*) AS user_count
FROM auth.users;

SELECT COUNT(*) AS recovery_token_count
FROM auth.account_recovery_tokens;

SELECT COUNT(*) AS appointment_count
FROM appointment.appointment;
