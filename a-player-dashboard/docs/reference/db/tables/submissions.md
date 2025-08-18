# Table: submissions

**Generated:** 2025-08-18 10:40:18
**Source:** docs/_generated/schema_public.sql

## Columns

| Name | Type | Nullable | Default | Notes |
|------|------|----------|---------|-------|
| submission_id | uuid | No | "gen_random_uuid"() | DEFAULT "gen_random_uuid"() NOT NULL |
| submission_time | timestamp with time zone | Yes | "now"() | DEFAULT "now"() |
| submitter_id | uuid | No | - | NOT NULL |
| evaluatee_id | uuid | No | - | NOT NULL |
| evaluation_type | character | No | - | varying(50) NOT NULL |
| quarter_id | uuid | No | - | NOT NULL |
| raw_json | jsonb | Yes | - | - |
| created_at | timestamp with time zone | Yes | "now"() | DEFAULT "now"() |
| company_id | uuid | No | - | NOT NULL |


## Constraints



## Foreign Keys

No foreign key constraints.


## Row Level Security

**Enabled:** Yes


