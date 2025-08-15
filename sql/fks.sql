-- Foreign keys introspection
-- Part of the backend documentation system

SELECT tc.table_schema, tc.table_name, kcu.column_name,
       ccu.table_schema AS foreign_table_schema,
       ccu.table_name   AS foreign_table_name,
       ccu.column_name  AS foreign_column_name
FROM information_schema.table_constraints AS tc
JOIN information_schema.key_column_usage AS kcu
  USING (constraint_name, table_schema, table_name)
JOIN information_schema.constraint_column_usage AS ccu
  USING (constraint_name, table_schema)
WHERE tc.constraint_type='FOREIGN KEY'
ORDER BY 1,2,3;
