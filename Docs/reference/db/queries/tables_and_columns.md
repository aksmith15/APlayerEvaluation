# Query: tables_and_columns

## Description
Database tables and columns introspection
Part of the backend documentation system

## SQL
```sql
-- Database tables and columns introspection
-- Part of the backend documentation system

-- List all tables
SELECT table_schema, table_name
FROM information_schema.tables
WHERE table_type='BASE TABLE'
  AND table_schema NOT IN ('pg_catalog','information_schema')
ORDER BY 1,2;

-- List all columns with details
SELECT table_schema, table_name, ordinal_position, column_name,
       data_type, is_nullable, column_default
FROM information_schema.columns
WHERE table_schema NOT IN ('pg_catalog','information_schema')
ORDER BY table_schema, table_name, ordinal_position;

```
