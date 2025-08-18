# Table: analysis_jobs

**Generated:** 2025-08-18 10:40:18
**Source:** docs/_generated/schema_public.sql

## Columns

| Name | Type | Nullable | Default | Notes |
|------|------|----------|---------|-------|
| id | uuid | No | "gen_random_uuid"() | DEFAULT "gen_random_uuid"() NOT NULL |
| evaluatee_id | uuid | No | - | NOT NULL |
| quarter_id | uuid | No | - | NOT NULL |
| status | character | No | 'pending'::character | varying(20) DEFAULT 'pending'::character varying NOT NULL |
| stage | text | Yes | - | - |
| created_at | timestamp with time zone | Yes | "now"() | DEFAULT "now"() |
| updated_at | timestamp with time zone | Yes | "now"() | DEFAULT "now"() |
| completed_at | timestamp with time zone | Yes | - | - |
| pdf_url | text | Yes | - | - |
| error_message | text | Yes | - | - |
| pdf_data | bytea | Yes | - | - |
| pdf_filename | text | Yes | - | - |
| company_id | uuid | No | - | NOT NULL |


## Constraints



## Foreign Keys

No foreign key constraints.


## Row Level Security

**Enabled:** Yes


