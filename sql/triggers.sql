-- Triggers introspection
-- Part of the backend documentation system

SELECT event_object_schema, event_object_table, trigger_name,
       action_timing, event_manipulation, action_statement
FROM information_schema.triggers
ORDER BY 1,2,3;
