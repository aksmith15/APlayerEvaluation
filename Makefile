SHELL := /bin/bash
# A-Player Evaluations Dashboard - Backend Documentation System
# Generates comprehensive database documentation, types, and edge function summaries

# Environment variables (override as needed)
DB_URL ?= $(DATABASE_URL)
SUPABASE_PROJECT_REF ?= # TODO: set if using remote supabase (get from dashboard URL)
ERD_ENABLED ?= 0        # set to 1 to build ERD (requires docker + additional tools)

# Colors for output
BLUE := \033[34m
GREEN := \033[32m
YELLOW := \033[33m
RED := \033[31m
RESET := \033[0m

.PHONY: docs schema markdown rls grants types edge erd clean help

# Default target - generate all documentation
docs: schema markdown rls grants types edge erd
	@echo -e "$(GREEN)✅ All documentation generated successfully!$(RESET)"
	@echo -e "$(BLUE)📁 Generated files:$(RESET)"
	@echo "   docs/db/schema.sql - Full database schema"
	@echo "   docs/db/overview.md - Tables, columns, indexes, etc."
	@echo "   docs/db/rls-policies.md - Row Level Security policies"
	@echo "   docs/db/grants.md - Database privileges"
	@echo "   docs/edge/functions.md - Edge Functions summary"
	@echo "   src/lib/database.types.ts - TypeScript types"

# Generate full database schema dump
schema:
	@echo -e "$(BLUE)🗃️  Generating database schema...$(RESET)"
	@mkdir -p docs/db
	@if command -v supabase >/dev/null 2>&1; then \
		if supabase status 2>/dev/null | grep -qi 'local db'; then \
			echo -e "$(GREEN)📡 Using Supabase local database$(RESET)"; \
			supabase db dump --local --schema-only > docs/db/schema.sql; \
		else \
			if [ -n "$(SUPABASE_PROJECT_REF)" ]; then \
				echo -e "$(GREEN)☁️  Using Supabase remote database$(RESET)"; \
				if [ -n "$(DB_URL)" ]; then \
					pg_dump "$$DB_URL" --schema-only --no-owner --no-privileges > docs/db/schema.sql; \
				else \
					echo -e "$(RED)❌ Set DATABASE_URL for remote schema dump$(RESET)"; exit 1; \
				fi; \
			else \
				echo -e "$(YELLOW)⚠️  No SUPABASE_PROJECT_REF set, falling back to DATABASE_URL$(RESET)"; \
				if [ -n "$(DB_URL)" ]; then \
					pg_dump "$$DB_URL" --schema-only --no-owner --no-privileges > docs/db/schema.sql; \
				else \
					echo -e "$(RED)❌ Set DATABASE_URL or SUPABASE_PROJECT_REF$(RESET)"; exit 1; \
				fi; \
			fi \
		fi \
	else \
		echo -e "$(YELLOW)⚠️  Supabase CLI not found, using pg_dump$(RESET)"; \
		if [ -n "$(DB_URL)" ]; then \
			pg_dump "$$DB_URL" --schema-only --no-owner --no-privileges > docs/db/schema.sql; \
		else \
			echo -e "$(RED)❌ Install supabase CLI or set DATABASE_URL$(RESET)"; exit 1; \
		fi; \
	fi
	@echo -e "$(GREEN)✅ Schema exported to docs/db/schema.sql$(RESET)"

# Generate markdown documentation from database catalog
markdown:
	@echo -e "$(BLUE)📝 Generating markdown documentation...$(RESET)"
	@chmod +x scripts/export_catalog_markdown.sh
	@./scripts/export_catalog_markdown.sh

# RLS policies (generated as part of markdown target)
rls:
	@echo -e "$(BLUE)🔒 RLS policies included in markdown documentation$(RESET)"

# Grants and privileges (generated as part of markdown target)
grants:
	@echo -e "$(BLUE)🔐 Grants included in markdown documentation$(RESET)"

# Generate TypeScript types from database
types:
	@echo -e "$(BLUE)📘 Generating TypeScript types...$(RESET)"
	@if command -v supabase >/dev/null 2>&1; then \
		if supabase status 2>/dev/null | grep -qi 'local db'; then \
			echo -e "$(GREEN)📡 Generating types from local database$(RESET)"; \
			mkdir -p src/lib; \
			supabase gen types typescript --local > src/lib/database.types.ts; \
			echo -e "$(GREEN)✅ Types generated from local Supabase$(RESET)"; \
		else \
			if [ -n "$(SUPABASE_PROJECT_REF)" ]; then \
				echo -e "$(GREEN)☁️  Generating types from remote database$(RESET)"; \
				mkdir -p src/lib; \
				supabase gen types typescript --project-id $(SUPABASE_PROJECT_REF) > src/lib/database.types.ts; \
				echo -e "$(GREEN)✅ Types generated from remote Supabase$(RESET)"; \
			else \
				echo -e "$(YELLOW)⚠️  No SUPABASE_PROJECT_REF set$(RESET)"; \
				mkdir -p src/lib; \
				echo "// TODO: set SUPABASE_PROJECT_REF in Makefile or use local supabase for types" > src/lib/database.types.ts; \
				echo "// Run: make types SUPABASE_PROJECT_REF=your-project-ref" >> src/lib/database.types.ts; \
				echo "// Or: supabase link --project-ref your-project-ref && make types" >> src/lib/database.types.ts; \
				echo -e "$(YELLOW)⚠️  TODO placeholder created in src/lib/database.types.ts$(RESET)"; \
			fi \
		fi \
	else \
		echo -e "$(YELLOW)⚠️  Supabase CLI not installed$(RESET)"; \
		mkdir -p src/lib; \
		echo "// TODO: install supabase CLI to generate DB types" > src/lib/database.types.ts; \
		echo "// Run: npm install -g supabase && make types" >> src/lib/database.types.ts; \
		echo -e "$(YELLOW)⚠️  TODO placeholder created in src/lib/database.types.ts$(RESET)"; \
	fi

# Generate Edge Functions documentation
edge:
	@echo -e "$(BLUE)⚡ Generating Edge Functions documentation...$(RESET)"
	@mkdir -p docs/edge
	@if command -v supabase >/dev/null 2>&1; then \
		if [ -n "$(SUPABASE_PROJECT_REF)" ]; then \
			echo -e "$(GREEN)☁️  Listing remote Edge Functions$(RESET)"; \
			echo "# Edge Functions" > docs/edge/functions.md; \
			echo "" >> docs/edge/functions.md; \
			echo "Generated on $$(date)" >> docs/edge/functions.md; \
			echo "" >> docs/edge/functions.md; \
			supabase functions list --project-ref $(SUPABASE_PROJECT_REF) >> docs/edge/functions.md 2>/dev/null || \
			echo "⚠️ Could not list remote functions. Check SUPABASE_PROJECT_REF and authentication." >> docs/edge/functions.md; \
		else \
			echo -e "$(YELLOW)⚠️  No SUPABASE_PROJECT_REF set$(RESET)"; \
			echo "# Edge Functions" > docs/edge/functions.md; \
			echo "" >> docs/edge/functions.md; \
			echo "TODO: set SUPABASE_PROJECT_REF and re-run to list remote functions" >> docs/edge/functions.md; \
			echo "Or run: make edge SUPABASE_PROJECT_REF=your-project-ref" >> docs/edge/functions.md; \
		fi; \
		echo "" >> docs/edge/functions.md; \
		echo "## Local Functions Directory" >> docs/edge/functions.md; \
		echo "" >> docs/edge/functions.md; \
		if [ -d "supabase/functions" ]; then \
			echo "### Available Functions:" >> docs/edge/functions.md; \
			echo "" >> docs/edge/functions.md; \
			find supabase/functions -name "index.ts" -type f | while read -r func; do \
				func_name=$$(basename $$(dirname "$$func")); \
				echo "- **$$func_name**" >> docs/edge/functions.md; \
				if [ -f "$$func" ]; then \
					description=$$(head -10 "$$func" | grep -E "^\s*//|^\s*\*" | head -3 | sed 's/^\s*[\/\*]*\s*//g' | tr '\n' ' ' | sed 's/\s\+/ /g'); \
					if [ -n "$$description" ]; then \
						echo "  - $$description" >> docs/edge/functions.md; \
					fi; \
				fi; \
			done; \
		else \
			echo "No supabase/functions directory found." >> docs/edge/functions.md; \
		fi \
	else \
		echo -e "$(YELLOW)⚠️  Supabase CLI not installed$(RESET)"; \
		echo "# Edge Functions" > docs/edge/functions.md; \
		echo "" >> docs/edge/functions.md; \
		echo "Supabase CLI not installed. Install with: npm install -g supabase" >> docs/edge/functions.md; \
	fi
	@echo -e "$(GREEN)✅ Edge Functions documentation generated$(RESET)"

# Generate ERD (Entity Relationship Diagram) - optional
erd:
ifneq ($(ERD_ENABLED),0)
	@echo -e "$(BLUE)🎨 Building ERD (Entity Relationship Diagram)...$(RESET)"
	@mkdir -p docs/db/erd
	@echo -e "$(YELLOW)⚠️  ERD generation requires additional setup$(RESET)"
	@echo "TODO: Configure ERD generation tool (SchemaSpy, dbdiagram.io, etc.)"
	@echo "Example setup for SchemaSpy:"
	@echo "  docker run --rm -v \$$(pwd)/docs/db/erd:/output schemaspy/schemaspy:latest -t pgsql -host HOST -db DB -u USER -p PASS -o /output"
	@echo "# ERD Generation" > docs/db/erd.md
	@echo "" >> docs/db/erd.md
	@echo "ERD generation is optional and requires additional tooling." >> docs/db/erd.md
	@echo "Set ERD_ENABLED=1 and configure your preferred ERD tool." >> docs/db/erd.md
else
	@echo -e "$(BLUE)⏭️  ERD generation disabled (ERD_ENABLED=0)$(RESET)"
endif

# Clean generated documentation
clean:
	@echo -e "$(BLUE)🧹 Cleaning generated documentation...$(RESET)"
	@rm -rf docs/db/overview.md docs/db/rls-policies.md docs/db/grants.md docs/db/schema.sql
	@rm -rf docs/edge/functions.md
	@rm -f src/lib/database.types.ts
	@echo -e "$(GREEN)✅ Documentation cleaned$(RESET)"

# Help target
help:
	@echo -e "$(BLUE)A-Player Evaluations Dashboard - Backend Documentation System$(RESET)"
	@echo ""
	@echo -e "$(GREEN)Available targets:$(RESET)"
	@echo "  docs     - Generate all documentation (default)"
	@echo "  schema   - Export database schema to docs/db/schema.sql"
	@echo "  markdown - Generate markdown docs from database catalog"
	@echo "  types    - Generate TypeScript types from database"
	@echo "  edge     - Generate Edge Functions documentation"
	@echo "  erd      - Generate ERD (set ERD_ENABLED=1)"
	@echo "  clean    - Remove all generated documentation"
	@echo "  help     - Show this help message"
	@echo ""
	@echo -e "$(GREEN)Environment variables:$(RESET)"
	@echo "  DATABASE_URL          - PostgreSQL connection string"
	@echo "  SUPABASE_PROJECT_REF  - Supabase project reference ID"
	@echo "  ERD_ENABLED           - Enable ERD generation (0 or 1)"
	@echo ""
	@echo -e "$(GREEN)Examples:$(RESET)"
	@echo "  make docs"
	@echo "  make docs DATABASE_URL=postgresql://..."
	@echo "  make types SUPABASE_PROJECT_REF=abcdefghijklmnop"
	@echo "  make erd ERD_ENABLED=1"
