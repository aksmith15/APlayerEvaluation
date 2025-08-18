# Table: company_memberships

**Generated:** 2025-08-18 10:40:18
**Source:** docs/_generated/schema_public.sql

## Columns

| Name | Type | Nullable | Default | Notes |
|------|------|----------|---------|-------|
| id | uuid | No | "gen_random_uuid"() | DEFAULT "gen_random_uuid"() NOT NULL |
| company_id | uuid | No | - | NOT NULL |
| profile_id | uuid | No | - | NOT NULL |
| role | public | No | 'member'::"public"."company_role" | ."company_role" DEFAULT 'member'::"public"."company_role" NOT NULL |
| invited_by | uuid | Yes | - | - |
| invited_at | timestamp with time zone | Yes | "now"() | DEFAULT "now"() |
| joined_at | timestamp with time zone | Yes | "now"() | DEFAULT "now"() |
| created_at | timestamp with time zone | No | "now"() | DEFAULT "now"() NOT NULL |
| updated_at | timestamp with time zone | No | "now"() | DEFAULT "now"() NOT NULL |


## Constraints



## Foreign Keys

No foreign key constraints.


## Row Level Security

**Enabled:** Yes

**Policies:**

- **memberships_company_access**
  - Using: `(EXISTS ( SELECT 1
   FROM "public"."company_memberships" "m"
  WHERE (("m"."company_id" = "company_memberships"."company_id") AND ("m"."profile_id" = "auth"."uid"()))))`


