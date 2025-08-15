#!/usr/bin/env bash
set -euo pipefail

# Edge Functions Cleanup Script
# Removes unused test and debug functions while preserving production and needed debug functions

echo "🧹 Starting Edge Functions Cleanup..."

# Change to project root
cd "$(dirname "$0")/.."

# Check if supabase functions directory exists
if [ ! -d "supabase/functions" ]; then
    echo "❌ supabase/functions directory not found!"
    exit 1
fi

echo "📁 Current functions directory:"
ls -la supabase/functions/

echo ""
echo "🔍 Functions to keep:"
echo "  ✅ accept-invite (production)"
echo "  ✅ create-invite (production)" 
echo "  ✅ ai-coaching-report (production)"
echo "  ✅ ai-strengths-insights (production)"
echo "  ✅ ai-development-insights (production)"
echo "  ✅ ai-descriptive-review (production)"
echo "  ✅ test-create-invite-debug (debug needed)"
echo "  ✅ _shared (utilities)"

echo ""
echo "❌ Functions to remove (20 total):"

# List of functions to remove
FUNCTIONS_TO_REMOVE=(
    "ai-insights-fixed"
    "ai-strengths-insights-copy" 
    "ai-strengths-test"
    "create-invite-step-debug"
    "debug-create-invite"
    "debug-invitation-email"
    "insights-minimal"
    "send-invitation-email"
    "send-invitation-email-debug"
    "send-simple-email"
    "test-exact-copy"
    "test-hello"
    "test-insights-debug"
    "test-minimal"
    "test-resend-detailed"
    "test-resend-simple"
    "test-simple"
    "test-smtp-direct"
    "test-ultra-minimal"
    "working-insights-test"
)

# Check which functions actually exist before removal
EXISTING_FUNCTIONS=()
for func in "${FUNCTIONS_TO_REMOVE[@]}"; do
    if [ -d "supabase/functions/$func" ]; then
        EXISTING_FUNCTIONS+=("$func")
        echo "  🗑️  $func"
    else
        echo "  ⚠️  $func (not found, skipping)"
    fi
done

if [ ${#EXISTING_FUNCTIONS[@]} -eq 0 ]; then
    echo ""
    echo "✅ No functions to remove - directory is already clean!"
    exit 0
fi

echo ""
read -p "❓ Remove ${#EXISTING_FUNCTIONS[@]} unused functions? (y/N): " confirm

if [[ $confirm =~ ^[Yy]$ ]]; then
    echo ""
    echo "🗑️  Removing unused functions..."
    
    for func in "${EXISTING_FUNCTIONS[@]}"; do
        echo "  Removing: $func"
        rm -rf "supabase/functions/$func"
    done
    
    echo ""
    echo "✅ Cleanup completed!"
    echo ""
    echo "📁 Remaining functions:"
    ls -la supabase/functions/
    
    echo ""
    echo "📋 Next steps:"
    echo "  1. Review the remaining functions above"
    echo "  2. Test your application to ensure everything works"
    echo "  3. Deploy to remove functions from remote:"
    echo "     supabase functions deploy"
    echo "  4. Or manually delete remote functions:"
    echo "     supabase functions delete [function-name]"
    
else
    echo ""
    echo "🚫 Cleanup cancelled - no functions were removed"
fi
