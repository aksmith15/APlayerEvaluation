# Table: assignment_submissions

**Generated:** 2025-08-18 10:40:18
**Source:** docs/_generated/schema_public.sql

## Columns

| Name | Type | Nullable | Default | Notes |
|------|------|----------|---------|-------|
| id | uuid | No | "gen_random_uuid"() | DEFAULT "gen_random_uuid"() NOT NULL |
| assignment_id | uuid | No | - | NOT NULL |
| submission_id | uuid | No | - | NOT NULL |
| created_at | timestamp with time zone | Yes | "now"() | DEFAULT "now"() |


## Constraints



## Foreign Keys

No foreign key constraints.


## Row Level Security

**Enabled:** Yes


