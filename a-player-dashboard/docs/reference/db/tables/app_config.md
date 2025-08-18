# Table: app_config

**Generated:** 2025-08-18 10:40:18
**Source:** docs/_generated/schema_public.sql

## Columns

| Name | Type | Nullable | Default | Notes |
|------|------|----------|---------|-------|
| id | integer | No | - | NOT NULL |
| key | character | No | - | varying(255) NOT NULL |
| value | text | No | - | NOT NULL |
| environment | character | Yes | 'production'::character | varying(50) DEFAULT 'production'::character varying |
| created_at | timestamp | Yes | "now"() | without time zone DEFAULT "now"() |


## Constraints



## Foreign Keys

No foreign key constraints.


## Row Level Security

**Enabled:** Yes


