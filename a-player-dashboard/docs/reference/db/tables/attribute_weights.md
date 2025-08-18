# Table: attribute_weights

**Generated:** 2025-08-18 10:40:18
**Source:** docs/_generated/schema_public.sql

## Columns

| Name | Type | Nullable | Default | Notes |
|------|------|----------|---------|-------|
| id | uuid | No | "gen_random_uuid"() | DEFAULT "gen_random_uuid"() NOT NULL |
| attribute_name | character | No | - | varying(100) NOT NULL |
| weight | numeric | No | 1.0 | (3,2) DEFAULT 1.0 NOT NULL |
| description | text | Yes | - | - |
| environment | character | No | 'production'::character | varying(20) DEFAULT 'production'::character varying NOT NULL |
| created_by | uuid | Yes | - | - |
| created_at | timestamp with time zone | Yes | "now"() | DEFAULT "now"() |
| updated_at | timestamp with time zone | Yes | "now"() | DEFAULT "now"() |
| company_id | uuid | No | - | NOT NULL |


## Constraints



## Foreign Keys

No foreign key constraints.


## Row Level Security

**Enabled:** No


