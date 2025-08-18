# Table: invitations

**Generated:** 2025-08-18 10:40:18
**Source:** docs/_generated/schema_public.sql

## Columns

| Name | Type | Nullable | Default | Notes |
|------|------|----------|---------|-------|
| id | uuid | No | "gen_random_uuid"() | DEFAULT "gen_random_uuid"() NOT NULL |
| company_id | uuid | No | - | NOT NULL |
| email | text | No | - | NOT NULL |
| role | public | No | 'member'::"public"."company_role" | ."company_role" DEFAULT 'member'::"public"."company_role" NOT NULL |
| token | uuid | No | "gen_random_uuid"() | DEFAULT "gen_random_uuid"() NOT NULL |
| invited_by | uuid | No | - | NOT NULL |
| expires_at | timestamp with time zone | No | ("now"() | DEFAULT ("now"() + '7 days'::interval) NOT NULL |
| accepted_at | timestamp with time zone | Yes | - | - |
| revoked_at | timestamp with time zone | Yes | - | - |
| created_at | timestamp with time zone | No | "now"() | DEFAULT "now"() NOT NULL |
| updated_at | timestamp with time zone | No | "now"() | DEFAULT "now"() NOT NULL |


## Constraints



## Foreign Keys

No foreign key constraints.


## Row Level Security

**Enabled:** Yes

**Policies:**

- **invitations_invitee_read**
  - Commands: SELECT
  - Using: `(("lower"("email") = "lower"(("auth"."jwt"() ->> 'email'::"text"))) AND ("accepted_at" IS NULL) AND ("revoked_at" IS NULL) AND ("expires_at" > "now"()))`

- **invitations_service_role**
  - Using: `("auth"."role"() = 'service_role'::"text")`
  - Check: `("auth"."role"() = 'service_role'::"text")`

- **invitations_super_admin_delete**
  - Commands: DELETE
  - Using: `"public"."is_super_admin_for_company"("company_id")`

- **invitations_super_admin_insert**
  - Commands: INSERT
  - Check: `("public"."is_super_admin_for_company"("company_id") AND ("company_id" = "public"."get_current_user_company_id"()) AND ("invited_by" IN ( SELECT "people"."id"
   FROM "public"."people"
  WHERE ((("people"."email")::"text" = ("auth"."jwt"() ->> 'email'::"text")) AND ("people"."active" = true)))))`

- **invitations_super_admin_select**
  - Commands: SELECT
  - Using: `"public"."is_super_admin_for_company"("company_id")`

- **invitations_super_admin_update**
  - Commands: UPDATE
  - Using: `"public"."is_super_admin_for_company"("company_id")`
  - Check: `"public"."is_super_admin_for_company"("company_id")`


