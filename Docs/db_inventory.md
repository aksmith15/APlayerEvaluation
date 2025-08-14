# Database Inventory Report

**Generated:** 2025-08-13T14:15:02.587Z
**Database:** A-Player Evaluations System
**Purpose:** Pre-migration snapshot for multi-tenancy implementation

## Overview

This document provides a comprehensive inventory of the current database schema before implementing multi-tenancy and enhanced security measures.

## Tables Inventory


### people
- **Rows:** 0
- **Accessible:** ✅ Yes



### evaluation_cycles
- **Rows:** 0
- **Accessible:** ✅ Yes



### weighted_evaluation_scores
- **Rows:** 51
- **Accessible:** ✅ Yes
- **Columns:** 19


### app_config
- **Rows:** 0
- **Accessible:** ✅ Yes



### analysis_jobs
- **Rows:** 0
- **Accessible:** ✅ Yes



### evaluation_assignments
- **Rows:** 0
- **Accessible:** ✅ Yes



### employee_quarter_notes
- **Rows:** 0
- **Accessible:** ✅ Yes



### attribute_weights
- **Rows:** 10
- **Accessible:** ✅ Yes
- **Columns:** 8


### core_group_calculations
- **Rows:** 0
- **Accessible:** ✅ Yes



### quarterly_trends
- **Rows:** 0
- **Accessible:** ✅ Yes



### attribute_responses
- **Rows:** 0
- **Accessible:** ✅ Yes



### core_group_breakdown
- **Rows:** 0
- **Accessible:** ✅ Yes



### persona_classifications
- **Rows:** 0
- **Accessible:** ✅ Yes



## Detailed Table Information


### weighted_evaluation_scores - Column Details

| Column Name | Data Type | Sample Value |
|-------------|-----------|--------------|
| evaluatee_id | string | `2639fa80-d382-4951-afa0-00096e16e2ad` |
| evaluatee_name | string | `Kolbe Smith` |
| quarter_id | string | `979d1cbc-2f98-4da7-bf17-a1664b951ebc` |
| quarter_name | string | `Q2 2025` |
| quarter_start_date | string | `2025-04-01` |
| quarter_end_date | string | `2025-06-30` |
| attribute_name | string | `accountability` |
| manager_score | number | `6.5` |
| peer_score | number | `7.5` |
| self_score | number | `6` |
| weighted_final_score | number | `6.8` |
| weighted_final_grade | string | `C` |
| manager_grade | string | `C` |
| peer_grade | string | `B` |
| self_grade | string | `C` |
| has_manager_eval | boolean | `true` |
| has_peer_eval | boolean | `true` |
| has_self_eval | boolean | `true` |
| completion_percentage | number | `100` |


### attribute_weights - Column Details

| Column Name | Data Type | Sample Value |
|-------------|-----------|--------------|
| id | string | `ac01fc5b-df99-496b-9118-fe002994dcb4` |
| attribute_name | string | `Continuous Improvement` |
| weight | number | `1.1` |
| description | string | `Important for long-term success` |
| environment | string | `production` |
| created_by | object | `null` |
| created_at | string | `2025-07-28T17:39:50.459128+00:00` |
| updated_at | string | `2025-08-13T12:30:32.742+00:00` |


## Key Findings

### Tables Successfully Inspected
- **Total Tables:** 13
- **Total Rows:** 61

### Potential Tenant-Scoped Tables
Based on the table names and structure, these tables likely need `company_id` for multi-tenancy:

- **people** (0 rows)
- **evaluation_cycles** (0 rows)
- **weighted_evaluation_scores** (51 rows)
- **analysis_jobs** (0 rows)
- **evaluation_assignments** (0 rows)
- **employee_quarter_notes** (0 rows)
- **attribute_weights** (10 rows)
- **core_group_calculations** (0 rows)
- **quarterly_trends** (0 rows)
- **attribute_responses** (0 rows)
- **core_group_breakdown** (0 rows)
- **persona_classifications** (0 rows)

### Global Reference Tables  
These tables likely remain global (no `company_id`):

- **app_config** - Application configuration settings

## Next Steps

1. **Phase 2:** Create detailed cleanup and normalization plan
2. **Phase 3:** Implement multi-tenancy with company scoping
3. **Phase 4:** Add security hardening and constraints
4. **Phase 5:** Generate migrations and verification tests

---
*This report was generated automatically by the database inventory script.*
