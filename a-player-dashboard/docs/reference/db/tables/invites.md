# Table: invites

**Generated:** 2025-08-18 10:40:18
**Source:** docs/_generated/schema_public.sql

## Columns

| Name | Type | Nullable | Default | Notes |
|------|------|----------|---------|-------|
| id | uuid | No | "gen_random_uuid"() | DEFAULT "gen_random_uuid"() NOT NULL |
| company_id | uuid | No | - | NOT NULL |
| email | text | No | - | NOT NULL |
| role_to_assign | public | No | 'member'::"public"."company_role" | ."company_role" DEFAULT 'member'::"public"."company_role" NOT NULL |
| token | text | No | - | NOT NULL |
| expires_at | timestamp with time zone | No | ("now"() | DEFAULT ("now"() + '7 days'::interval) NOT NULL |
| claimed_at | timestamp with time zone | Yes | - | - |
| revoked_at | timestamp with time zone | Yes | - | - |
| created_by | uuid | No | - | NOT NULL |
| created_at | timestamp with time zone | No | "now"() | DEFAULT "now"() NOT NULL |


## Constraints



## Foreign Keys

No foreign key constraints.


## Row Level Security

**Enabled:** Yes

**Policies:**

- **company_admins_can_create_invites**
  - Commands: INSERT
  - Check: `(("company_id" = "public"."get_user_company_from_auth"()) AND "public"."is_current_user_admin"())`

- **company_admins_can_update_invites**
  - Commands: UPDATE
  - Using: `(("company_id" = "public"."get_user_company_from_auth"()) AND "public"."is_current_user_admin"())`
  - Check: `(("company_id" = "public"."get_user_company_from_auth"()) AND "public"."is_current_user_admin"())`

- **company_admins_can_view_invites**
  - Commands: SELECT
  - Using: `(("company_id" = "public"."get_user_company_from_auth"()) AND "public"."is_current_user_admin"())`

- **public_can_view_by_token**
  - Commands: SELECT
  - Using: `(("claimed_at" IS NULL) AND ("revoked_at" IS NULL) AND ("expires_at" > "now"()))`


