# Table: profiles

**Generated:** 2025-08-18 10:40:18
**Source:** docs/_generated/schema_public.sql

## Columns

| Name | Type | Nullable | Default | Notes |
|------|------|----------|---------|-------|
| id | uuid | No | - | NOT NULL |
| email | text | No | - | NOT NULL |
| full_name | text | Yes | - | - |
| avatar_url | text | Yes | - | - |
| default_company_id | uuid | Yes | - | - |
| timezone | text | Yes | 'UTC'::"text" | DEFAULT 'UTC'::"text" |
| locale | text | Yes | 'en'::"text" | DEFAULT 'en'::"text" |
| created_at | timestamp with time zone | No | "now"() | DEFAULT "now"() NOT NULL |
| updated_at | timestamp with time zone | No | "now"() | DEFAULT "now"() NOT NULL |
| is_active | boolean | No | true | DEFAULT true NOT NULL |
| last_seen_at | timestamp with time zone | Yes | - | - |


## Constraints



## Foreign Keys

No foreign key constraints.


## Row Level Security

**Enabled:** Yes

**Policies:**

- **profiles_self_and_company_access**
  - Using: `(("id" = "auth"."uid"()) OR (EXISTS ( SELECT 1
   FROM ("public"."company_memberships" "m1"
     JOIN "public"."company_memberships" "m2" ON (("m1"."company_id" = "m2"."company_id")))
  WHERE (("m1"."profile_id" = "auth"."uid"()) AND ("m2"."profile_id" = "profiles"."id")))))`


