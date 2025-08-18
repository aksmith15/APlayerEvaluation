# Query: pks

## Description
Primary keys introspection
Part of the backend documentation system

## SQL
```sql
-- Primary keys introspection
-- Part of the backend documentation system

SELECT tc.table_schema, tc.table_name, kcu.column_name
FROM information_schema.table_constraints tc
JOIN information_schema.key_column_usage kcu
  USING (constraint_name, table_schema, table_name)
WHERE tc.constraint_type='PRIMARY KEY'
ORDER BY 1,2,3;

```
