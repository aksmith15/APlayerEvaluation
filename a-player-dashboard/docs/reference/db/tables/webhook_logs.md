# Table: webhook_logs

**Generated:** 2025-08-18 10:40:18
**Source:** docs/_generated/schema_public.sql

## Columns

| Name | Type | Nullable | Default | Notes |
|------|------|----------|---------|-------|
| id | uuid | No | "gen_random_uuid"() | DEFAULT "gen_random_uuid"() NOT NULL |
| submission_id | uuid | Yes | - | - |
| webhook_url | text | No | - | NOT NULL |
| payload | jsonb | Yes | - | - |
| response_status | integer | Yes | - | - |
| response_body | text | Yes | - | - |
| error_message | text | Yes | - | - |
| retry_count | integer | Yes | 0 | DEFAULT 0 |
| delivered_at | timestamp with time zone | Yes | - | - |
| created_at | timestamp with time zone | Yes | "now"() | DEFAULT "now"() |


## Constraints



## Foreign Keys

No foreign key constraints.


## Row Level Security

**Enabled:** No


