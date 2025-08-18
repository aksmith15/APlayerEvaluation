# Table: employee_quarter_notes

**Generated:** 2025-08-18 10:40:18
**Source:** docs/_generated/schema_public.sql

## Columns

| Name | Type | Nullable | Default | Notes |
|------|------|----------|---------|-------|
| id | uuid | No | "gen_random_uuid"() | DEFAULT "gen_random_uuid"() NOT NULL |
| employee_id | uuid | No | - | NOT NULL |
| quarter_id | uuid | No | - | NOT NULL |
| notes | text | No | ''::"text" | DEFAULT ''::"text" NOT NULL |
| created_by | uuid | Yes | - | - |
| created_at | timestamp with time zone | Yes | "now"() | DEFAULT "now"() |
| updated_at | timestamp with time zone | Yes | "now"() | DEFAULT "now"() |
| company_id | uuid | No | - | NOT NULL |


## Constraints



## Foreign Keys

No foreign key constraints.


## Row Level Security

**Enabled:** Yes


