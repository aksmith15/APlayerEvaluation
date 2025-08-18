# Table: evaluation_completion_status

**Generated:** 2025-08-18 10:40:18
**Source:** docs/_generated/schema_public.sql

## Columns

| Name | Type | Nullable | Default | Notes |
|------|------|----------|---------|-------|
| id | uuid | No | "gen_random_uuid"() | DEFAULT "gen_random_uuid"() NOT NULL |
| evaluatee_id | uuid | No | - | NOT NULL |
| quarter_id | uuid | No | - | NOT NULL |
| self_assigned_count | integer | Yes | 0 | DEFAULT 0 |
| manager_assigned_count | integer | Yes | 0 | DEFAULT 0 |
| total_peer_assigned | integer | Yes | 0 | DEFAULT 0 |
| self_completed | boolean | Yes | false | DEFAULT false |
| manager_completed | boolean | Yes | false | DEFAULT false |
| peer_completed_count | integer | Yes | 0 | DEFAULT 0 |
| all_evaluations_complete | boolean | Yes | false | DEFAULT false |
| ai_analysis_triggered | boolean | Yes | false | DEFAULT false |
| ai_analysis_completed | boolean | Yes | false | DEFAULT false |
| first_submission_at | timestamp with time zone | Yes | - | - |
| last_submission_at | timestamp with time zone | Yes | - | - |
| completion_detected_at | timestamp with time zone | Yes | - | - |
| ai_triggered_at | timestamp with time zone | Yes | - | - |
| created_at | timestamp with time zone | Yes | "now"() | DEFAULT "now"() |
| updated_at | timestamp with time zone | Yes | "now"() | DEFAULT "now"() |


## Constraints



## Foreign Keys

No foreign key constraints.


## Row Level Security

**Enabled:** No


