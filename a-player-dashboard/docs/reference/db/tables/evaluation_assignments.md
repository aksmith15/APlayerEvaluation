# Table: evaluation_assignments

**Generated:** 2025-08-18 10:40:18
**Source:** docs/_generated/schema_public.sql

## Columns

| Name | Type | Nullable | Default | Notes |
|------|------|----------|---------|-------|
| id | uuid | No | "gen_random_uuid"() | DEFAULT "gen_random_uuid"() NOT NULL |
| evaluator_id | uuid | No | - | NOT NULL |
| evaluatee_id | uuid | No | - | NOT NULL |
| quarter_id | uuid | No | - | NOT NULL |
| evaluation_type | text | Yes | - | - |
| status | text | Yes | 'pending'::"text" | DEFAULT 'pending'::"text" |
| assigned_by | uuid | No | - | NOT NULL |
| assigned_at | timestamp | Yes | "now"() | without time zone DEFAULT "now"() |
| completed_at | timestamp | Yes | - | without time zone |
| survey_token | uuid | Yes | "gen_random_uuid"() | DEFAULT "gen_random_uuid"() |
| created_at | timestamp | Yes | "now"() | without time zone DEFAULT "now"() |
| company_id | uuid | No | - | NOT NULL |


## Constraints



## Foreign Keys

No foreign key constraints.


## Row Level Security

**Enabled:** Yes


