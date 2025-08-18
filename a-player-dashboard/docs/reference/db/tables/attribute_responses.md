# Table: attribute_responses

**Generated:** 2025-08-18 10:40:18
**Source:** docs/_generated/schema_public.sql

## Columns

| Name | Type | Nullable | Default | Notes |
|------|------|----------|---------|-------|
| id | uuid | No | "gen_random_uuid"() | DEFAULT "gen_random_uuid"() NOT NULL |
| submission_id | uuid | No | - | NOT NULL |
| attribute_name | character | No | - | varying(100) NOT NULL |
| question_id | character | Yes | - | varying(50) |
| question_text | text | No | - | NOT NULL |
| response_type | character | Yes | - | varying(50) |
| response_value | jsonb | Yes | - | - |
| score_context | integer | Yes | - | - |
| attribute_score_id | uuid | Yes | - | - |
| created_at | timestamp with time zone | Yes | "now"() | DEFAULT "now"() |


## Constraints



## Foreign Keys

No foreign key constraints.


## Row Level Security

**Enabled:** Yes


