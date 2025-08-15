#!/usr/bin/env bash
set -euo pipefail

# Fallback script for npm run docs when Make isn't available
# A-Player Evaluations Dashboard - Backend Documentation System

echo "🚀 Running backend documentation generation..."

# Change to project root directory
cd "$(dirname "$0")/.."

# Check if Make is available
if command -v make >/dev/null 2>&1; then
    echo "✅ Make is available, running: make docs"
    make docs
else
    echo "⚠️  Make not available, running fallback documentation generation..."
    
    # Ensure directories exist
    mkdir -p docs/db docs/edge src/lib
    
    # Run the export script directly
    if [ -f "scripts/export_catalog_markdown.sh" ]; then
        echo "📝 Generating markdown documentation..."
        chmod +x scripts/export_catalog_markdown.sh
        ./scripts/export_catalog_markdown.sh
    else
        echo "❌ Export script not found at scripts/export_catalog_markdown.sh"
        exit 1
    fi
    
    # Generate schema if tools are available
    echo "🗃️  Attempting to generate database schema..."
    if command -v supabase >/dev/null 2>&1; then
        if supabase status 2>/dev/null | grep -qi 'local db'; then
            echo "📡 Generating schema from local Supabase..."
            supabase db dump --local --schema-only > docs/db/schema.sql
        elif [ -n "${DATABASE_URL:-}" ]; then
            echo "🔗 Generating schema from DATABASE_URL..."
            pg_dump "$DATABASE_URL" --schema-only --no-owner --no-privileges > docs/db/schema.sql
        else
            echo "⚠️  No local DB or DATABASE_URL available for schema generation"
            echo "-- TODO: Configure DATABASE_URL or set up local Supabase" > docs/db/schema.sql
        fi
    elif [ -n "${DATABASE_URL:-}" ] && command -v pg_dump >/dev/null 2>&1; then
        echo "🔗 Generating schema using pg_dump..."
        pg_dump "$DATABASE_URL" --schema-only --no-owner --no-privileges > docs/db/schema.sql
    else
        echo "⚠️  No database tools available for schema generation"
        echo "-- TODO: Install supabase CLI or pg_dump, and set DATABASE_URL" > docs/db/schema.sql
    fi
    
    # Generate TypeScript types
    echo "📘 Attempting to generate TypeScript types..."
    if command -v supabase >/dev/null 2>&1; then
        if supabase status 2>/dev/null 2>&1 | grep -qi 'local db'; then
            echo "📡 Generating types from local Supabase..."
            supabase gen types typescript --local > src/lib/database.types.ts
        elif [ -n "${SUPABASE_PROJECT_REF:-}" ]; then
            echo "☁️  Generating types from remote Supabase..."
            supabase gen types typescript --project-id "$SUPABASE_PROJECT_REF" > src/lib/database.types.ts
        else
            echo "⚠️  No local DB or SUPABASE_PROJECT_REF available"
            cat > src/lib/database.types.ts << 'EOF'
// TODO: Configure Supabase for TypeScript type generation
// Options:
// 1. Set up local Supabase: supabase start
// 2. Set SUPABASE_PROJECT_REF environment variable
// 3. Run: npm run docs:types

export type Database = {
  // TODO: Generated types will appear here
};
EOF
        fi
    else
        echo "⚠️  Supabase CLI not available for type generation"
        cat > src/lib/database.types.ts << 'EOF'
// TODO: Install Supabase CLI for TypeScript type generation
// Run: npm install -g supabase
// Then: npm run docs:types

export type Database = {
  // TODO: Generated types will appear here
};
EOF
    fi
    
    # Generate Edge Functions documentation
    echo "⚡ Generating Edge Functions documentation..."
    echo "# Edge Functions" > docs/edge/functions.md
    echo "" >> docs/edge/functions.md
    echo "Generated on $(date)" >> docs/edge/functions.md
    echo "" >> docs/edge/functions.md
    
    if [ -d "supabase/functions" ]; then
        echo "## Available Functions:" >> docs/edge/functions.md
        echo "" >> docs/edge/functions.md
        find supabase/functions -name "index.ts" -type f | while read -r func; do
            func_name=$(basename $(dirname "$func"))
            echo "- **$func_name**" >> docs/edge/functions.md
            if [ -f "$func" ]; then
                description=$(head -10 "$func" | grep -E "^\s*//|^\s*\*" | head -3 | sed 's/^\s*[\/\*]*\s*//g' | tr '\n' ' ' | sed 's/\s\+/ /g')
                if [ -n "$description" ]; then
                    echo "  - $description" >> docs/edge/functions.md
                fi
            fi
        done
    else
        echo "No supabase/functions directory found." >> docs/edge/functions.md
    fi
    
    echo ""
    echo "✅ Fallback documentation generation completed!"
fi

echo ""
echo "📁 Generated documentation files:"
echo "   - docs/db/schema.sql"
echo "   - docs/db/overview.md"
echo "   - docs/db/rls-policies.md"
echo "   - docs/db/grants.md"
echo "   - docs/edge/functions.md"
echo "   - src/lib/database.types.ts"
echo ""
echo "💡 To set up full functionality:"
echo "   - Install Make for complete build system"
echo "   - Set DATABASE_URL for schema generation"
echo "   - Set SUPABASE_PROJECT_REF for remote type generation"
