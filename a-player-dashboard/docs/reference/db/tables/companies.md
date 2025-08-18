# Table: companies

**Generated:** 2025-08-18 10:40:18
**Source:** docs/_generated/schema_public.sql

## Columns

| Name | Type | Nullable | Default | Notes |
|------|------|----------|---------|-------|
| id | uuid | No | "gen_random_uuid"() | DEFAULT "gen_random_uuid"() NOT NULL |
| name | text | No | - | NOT NULL |
| slug | text | Yes | - | GENERATED ALWAYS AS ("regexp_replace"("regexp_replace"("lower"(TRIM(BOTH FROM "name")), '[^a-z0-9\s-]'::"text", ''::"text", 'g'::"text"), '\s+'::"text", '-'::"text", 'g'::"text")) STORED |
| description | text | Yes | - | - |
| website | text | Yes | - | - |
| logo_url | text | Yes | - | - |
| created_at | timestamp with time zone | No | "now"() | DEFAULT "now"() NOT NULL |
| updated_at | timestamp with time zone | No | "now"() | DEFAULT "now"() NOT NULL |
| deleted_at | timestamp with time zone | Yes | - | - |


## Constraints



## Foreign Keys

No foreign key constraints.


## Row Level Security

**Enabled:** Yes

**Policies:**

- **companies_people_robust_access**
  - Using: `((EXISTS ( SELECT 1
   FROM "public"."people" "p"
  WHERE (("p"."company_id" = "companies"."id") AND ("p"."id" = "auth"."uid"())))) OR (EXISTS ( SELECT 1
   FROM "public"."people" "p"
  WHERE (("p"."company_id" = "companies"."id") AND (("p"."email")::"text" = ("auth"."jwt"() ->> 'email'::"text"))))) OR (("id" = '00000000-0000-0000-0000-000000000001'::"uuid") AND ("auth"."role"() = 'authenticated'::"text")))`

- **legacy_company_temp_access**
  - Using: `(("id" = '00000000-0000-0000-0000-000000000001'::"uuid") AND ("auth"."role"() = 'authenticated'::"text"))`


