-- Grants and privileges introspection
-- Part of the backend documentation system

SELECT table_schema, table_name, privilege_type, grantee
FROM information_schema.table_privileges
WHERE table_schema NOT IN ('pg_catalog','information_schema')
ORDER BY 1,2,3,4;
