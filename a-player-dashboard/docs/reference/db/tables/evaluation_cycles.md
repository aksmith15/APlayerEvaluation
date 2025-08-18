# Table: evaluation_cycles

**Generated:** 2025-08-18 10:40:18
**Source:** docs/_generated/schema_public.sql

## Columns

| Name | Type | Nullable | Default | Notes |
|------|------|----------|---------|-------|
| id | uuid | No | "gen_random_uuid"() | DEFAULT "gen_random_uuid"() NOT NULL |
| name | character | No | - | varying(100) NOT NULL |
| start_date | date | No | - | NOT NULL |
| end_date | date | No | - | NOT NULL |
| created_at | timestamp with time zone | Yes | "now"() | DEFAULT "now"() |
| company_id | uuid | No | - | NOT NULL |


## Constraints



## Foreign Keys

No foreign key constraints.


## Row Level Security

**Enabled:** Yes


