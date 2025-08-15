-- Row Level Security introspection
-- Part of the backend documentation system

-- Tables with RLS flags
SELECT schemaname, tablename, rowsecurity AS rls_enabled
FROM pg_tables
WHERE schemaname NOT IN ('pg_catalog','information_schema')
ORDER BY 1,2;

-- RLS Policies
SELECT schemaname, tablename, policyname, permissive, roles, cmd, qual, with_check
FROM pg_policies
ORDER BY 1,2,3;
