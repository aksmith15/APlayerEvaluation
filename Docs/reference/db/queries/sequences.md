# Query: sequences

## Description
Sequences introspection
Part of the backend documentation system

## SQL
```sql
-- Sequences introspection
-- Part of the backend documentation system

SELECT sequence_schema, sequence_name, data_type, start_value, minimum_value, maximum_value, increment
FROM information_schema.sequences
ORDER BY 1,2;

```
