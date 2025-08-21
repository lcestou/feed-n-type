#!/bin/bash

# Auto-update changelog using technical-documentation-writer agent
# This hook runs after file edits to maintain CHANGELOG.md

# Check if there are any staged or unstaged changes
if ! git diff --quiet HEAD 2>/dev/null && ! git diff --cached --quiet 2>/dev/null; then
    echo "📝 Auto-updating CHANGELOG.md via technical-documentation-writer agent..."
    
    # Call Claude Code to run the technical-documentation-writer agent
    # Note: This would need Claude Code to support agent execution from hooks
    # For now, this serves as a placeholder for the intended functionality
    echo "📋 Changes detected - CHANGELOG.md should be updated by technical-documentation-writer agent"
fi