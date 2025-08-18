# Table: reports

**Generated:** 2025-08-18 10:40:18
**Source:** docs/_generated/schema_public.sql

## Columns

| Name | Type | Nullable | Default | Notes |
|------|------|----------|---------|-------|
| id | uuid | No | "gen_random_uuid"() | DEFAULT "gen_random_uuid"() NOT NULL |
| evaluatee_id | uuid | No | - | NOT NULL |
| quarter_id | uuid | No | - | NOT NULL |
| report_type | character | No | - | varying(50) NOT NULL |
| pdf_url | text | Yes | - | - |
| created_at | timestamp with time zone | Yes | "now"() | DEFAULT "now"() |


## Constraints



## Foreign Keys

No foreign key constraints.


## Row Level Security

**Enabled:** No


