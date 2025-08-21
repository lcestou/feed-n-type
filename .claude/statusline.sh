#!/bin/bash

# Auto-detect if we need to re-execute from the correct path
# This handles both container (/workspace) and host environments
if [ "$1" != "--no-redirect" ]; then
    if [ -f "/workspace/.claude/statusline.sh" ] && [ "$0" != "/workspace/.claude/statusline.sh" ]; then
        # We're in container but called from wrong path
        exec /workspace/.claude/statusline.sh --no-redirect
    fi
fi

# Read JSON input from Claude Code
input=$(cat)

# Extract data from JSON
MODEL=$(echo "$input" | jq -r '.model.display_name')
CONTEXT_USED=$(echo "$input" | jq -r '.session.context_window.used // 0')
CONTEXT_MAX=$(echo "$input" | jq -r '.session.context_window.max // 200000')
DIR=$(echo "$input" | jq -r '.workspace.current_dir')

# Calculate context percentage
if [ "$CONTEXT_MAX" -gt 0 ]; then
    PERCENT=$((CONTEXT_USED * 100 / CONTEXT_MAX))
else
    PERCENT=0
fi

# Get git branch if in a git repo
GIT_BRANCH=""
if [ -d ".git" ] || git rev-parse --git-dir > /dev/null 2>&1; then
    BRANCH=$(git branch 2>/dev/null | grep "^\*" | cut -c3-)
    if [ -n "$BRANCH" ]; then
        GIT_BRANCH=" (${BRANCH})"
    fi
fi

# Create context bar visualization
# Use 10 blocks for the bar
BAR_LENGTH=10
FILLED=$((PERCENT * BAR_LENGTH / 100))
EMPTY=$((BAR_LENGTH - FILLED))

# Build the bar (no colors since they aren't rendering)
BAR=""
for i in $(seq 1 $FILLED); do
    BAR="${BAR}█"
done
for i in $(seq 1 $EMPTY); do
    BAR="${BAR}░"
done

# Get project name from package.json if it exists, otherwise use git remote or fall back to "feed-n-type"
PROJECT_NAME="feed-n-type"
if [ -f "package.json" ] && command -v jq >/dev/null 2>&1; then
    PKG_NAME=$(jq -r '.name // empty' package.json 2>/dev/null)
    if [ -n "$PKG_NAME" ] && [ "$PKG_NAME" != "null" ]; then
        PROJECT_NAME="$PKG_NAME"
    fi
fi

# Build status line without ANSI codes
printf "[$MODEL] 📁 ${PROJECT_NAME}${GIT_BRANCH} │ C: [${BAR}] ${PERCENT}%%"