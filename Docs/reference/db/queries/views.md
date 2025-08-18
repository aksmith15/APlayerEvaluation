# Query: views

## Description
Views and materialized views introspection
Part of the backend documentation system

## SQL
```sql
-- Views and materialized views introspection
-- Part of the backend documentation system

-- Regular views
SELECT table_schema, table_name, view_definition
FROM information_schema.views
WHERE table_schema NOT IN ('pg_catalog','information_schema')
ORDER BY 1,2;

-- Materialized views
SELECT schemaname, matviewname, definition
FROM pg_matviews
ORDER BY 1,2;

```
