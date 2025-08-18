# Query: indexes

## Description
Indexes introspection
Part of the backend documentation system

## SQL
```sql
-- Indexes introspection
-- Part of the backend documentation system

SELECT schemaname, tablename, indexname, indexdef
FROM pg_indexes
WHERE schemaname NOT IN ('pg_catalog','information_schema')
ORDER BY 1,2,3;

```
