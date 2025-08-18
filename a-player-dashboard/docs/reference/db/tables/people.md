# Table: people

**Generated:** 2025-08-18 10:40:18
**Source:** docs/_generated/schema_public.sql

## Columns

| Name | Type | Nullable | Default | Notes |
|------|------|----------|---------|-------|
| id | uuid | No | "gen_random_uuid"() | DEFAULT "gen_random_uuid"() NOT NULL |
| name | character | No | - | varying(255) NOT NULL |
| email | character | No | - | varying(255) NOT NULL |
| role | character | Yes | - | varying(100) |
| active | boolean | Yes | true | DEFAULT true |
| person_description | text | Yes | - | - |
| manager_notes | text | Yes | - | - |
| department | character | Yes | - | varying(100) |
| hire_date | date | Yes | - | - |
| created_at | timestamp with time zone | Yes | "now"() | DEFAULT "now"() |
| jwt_role | text | Yes | - | - |
| profile_picture_url | text | Yes | - | - |
| company_id | uuid | No | - | NOT NULL |


## Constraints



## Foreign Keys

No foreign key constraints.


## Row Level Security

**Enabled:** Yes

**Policies:**

- **people_service_role_access**
  - Using: `("auth"."role"() = 'service_role'::"text")`


