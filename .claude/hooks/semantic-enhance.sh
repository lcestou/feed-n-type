#!/bin/bash

# Semantic Enhancement Pre-Hook
# Runs before smart-lint to add semantic IDs and JSDoc

source .claude/hooks/common-helpers.sh

# Parse the tool input JSON
if [ -t 0 ]; then
    echo "⚠️  Warning: No input data received via stdin"
    exit 0
fi

INPUT=$(cat)
TOOL_NAME=$(echo "$INPUT" | jq -r '.toolName // "unknown"')
FILE_PATH=$(echo "$INPUT" | jq -r '.parameters.file_path // .parameters.relative_path // ""')

# Only process JavaScript/TypeScript files
if [[ ! "$FILE_PATH" =~ \.(js|ts|jsx|tsx|svelte)$ ]]; then
    exit 0
fi

# Skip test files and existing crappy test files
if [[ "$FILE_PATH" =~ (test|spec|crappy|messy) ]]; then
    exit 0
fi

echo "🔍 Analyzing $FILE_PATH for semantic enhancements..."

# Check if file needs semantic IDs or JSDoc
needs_semantic_ids=false
needs_jsdoc=false

if [ -f "$FILE_PATH" ]; then
    # Check for missing semantic IDs in components/functions
    if grep -q "function\|const.*=\|export" "$FILE_PATH" && ! grep -q "id:" "$FILE_PATH"; then
        needs_semantic_ids=true
    fi
    
    # Check for missing JSDoc on exported functions
    if grep -q "export.*function\|export const.*=" "$FILE_PATH" && ! grep -q "/\*\*" "$FILE_PATH"; then
        needs_jsdoc=true
    fi
fi

if [ "$needs_semantic_ids" = true ] || [ "$needs_jsdoc" = true ]; then
    echo "🤖 Delegating enhancements for $FILE_PATH:"
    
    if [ "$needs_semantic_ids" = true ]; then
        echo "  ✨ Adding semantic IDs"
    fi
    
    if [ "$needs_jsdoc" = true ]; then
        echo "  📝 Adding JSDoc documentation"
    fi
    
    # Create enhancement task
    cat > /tmp/enhancement_task.json << EOF
{
    "file_path": "$FILE_PATH",
    "needs_semantic_ids": $needs_semantic_ids,
    "needs_jsdoc": $needs_jsdoc,
    "tool_name": "$TOOL_NAME"
}
EOF
    
    echo "📋 Enhancement task queued for intelligent agents"
else
    echo "✅ $FILE_PATH appears well-documented"
fi

exit 0