#!/bin/bash

# Check if there are uncommitted changes
CHANGES=$(git diff --name-only 2>/dev/null)
STAGED=$(git diff --cached --name-only 2>/dev/null)
CHANGELOG_MODIFIED=$(git diff --name-only CHANGELOG.md 2>/dev/null)

# Check what types of files were changed
HAS_CODE_CHANGES=false
HAS_CONFIG_CHANGES=false
HAS_DOC_CHANGES=false

for file in $CHANGES $STAGED; do
    if [[ $file == *.svelte ]] || [[ $file == *.ts ]] || [[ $file == *.js ]]; then
        HAS_CODE_CHANGES=true
    elif [[ $file == *.json ]] || [[ $file == *.yml ]] || [[ $file == *.yaml ]] || [[ $file == *.toml ]]; then
        HAS_CONFIG_CHANGES=true
    elif [[ $file == *.md ]] && [[ $file != "CHANGELOG.md" ]]; then
        HAS_DOC_CHANGES=true
    fi
done

# Generate contextual reminder
if [[ -n "$CHANGES" ]] || [[ -n "$STAGED" ]]; then
    if [[ -z "$CHANGELOG_MODIFIED" ]]; then
        echo "📝 Reminder: Consider updating CHANGELOG.md based on recent changes:"
        
        if [[ "$HAS_CODE_CHANGES" == "true" ]]; then
            echo "  • Component/feature changes detected"
        fi
        
        if [[ "$HAS_CONFIG_CHANGES" == "true" ]]; then
            echo "  • Configuration changes detected"
        fi
        
        if [[ "$HAS_DOC_CHANGES" == "true" ]]; then
            echo "  • Documentation changes detected"
        fi
        
        # Show a brief summary of changed files
        echo "  Modified files: $(echo $CHANGES $STAGED | tr ' ' '\n' | sort -u | head -3 | tr '\n' ' ')"
        
        # Count total changes
        TOTAL_CHANGES=$(echo $CHANGES $STAGED | tr ' ' '\n' | sort -u | wc -l)
        if [[ $TOTAL_CHANGES -gt 3 ]]; then
            echo "  ... and $((TOTAL_CHANGES - 3)) more files"
        fi
    fi
fi