#!/bin/bash
# Auto-update changelog based on recent commits
# Called after successful git commits to maintain changelog

CHANGELOG_FILE="CHANGELOG.md"
TEMP_FILE=$(mktemp)

# Get the commit message (pre-commit mode only)
if [ -z "$1" ]; then
    echo "Error: Commit message required. Usage: $0 \"commit message\""
    exit 1
fi

COMMIT_SUBJECT="$1"

# Determine change type from commit message
CHANGE_TYPE="Changed"
if [[ "$COMMIT_SUBJECT" =~ ^feat(\(.*\))?:.*$ ]]; then
    CHANGE_TYPE="Added"
elif [[ "$COMMIT_SUBJECT" =~ ^fix(\(.*\))?:.*$ ]]; then
    CHANGE_TYPE="Fixed"
elif [[ "$COMMIT_SUBJECT" =~ ^docs(\(.*\))?:.*$ ]]; then
    CHANGE_TYPE="Changed"
elif [[ "$COMMIT_SUBJECT" =~ ^refactor(\(.*\))?:.*$ ]]; then
    CHANGE_TYPE="Changed"
elif [[ "$COMMIT_SUBJECT" =~ ^perf(\(.*\))?:.*$ ]]; then
    CHANGE_TYPE="Changed"
elif [[ "$COMMIT_SUBJECT" =~ ^test(\(.*\))?:.*$ ]]; then
    CHANGE_TYPE="Changed"
fi

# Extract clean description (remove conventional commit prefix)
DESCRIPTION=$(echo "$COMMIT_SUBJECT" | sed -E 's/^[a-z]+(\([^)]*\))?:\s*//')
DESCRIPTION="$(echo "$DESCRIPTION" | sed 's/^./\U&/')" # Capitalize first letter

# Get today's date
TODAY=$(date +%Y-%m-%d)

# Read current changelog
if [ ! -f "$CHANGELOG_FILE" ]; then
    echo "Changelog file not found: $CHANGELOG_FILE"
    exit 1
fi

# Check if today's section exists, if not create it
if ! grep -q "## $TODAY" "$CHANGELOG_FILE"; then
    # Find [Unreleased] section and add today's section after it
    awk -v today="$TODAY" '
    /^## \[Unreleased\]/ {
        print $0
        getline
        while (getline && !/^## /) {
            print $0
        }
        print ""
        print "## " today
        print ""
        print "### Added"
        print ""
        print "### Changed" 
        print ""
        print "### Fixed"
        print ""
        if (/^## /) print $0
        next
    }
    { print }
    ' "$CHANGELOG_FILE" > "$TEMP_FILE"
    mv "$TEMP_FILE" "$CHANGELOG_FILE"
fi

# Add the new entry under the appropriate section for today
# Pre-commit mode - no hash comment needed

awk -v today="$TODAY" -v change_type="$CHANGE_TYPE" -v description="$DESCRIPTION" '
/^## '"$TODAY"'/ {
    in_today_section = 1
    print $0
    next
}
/^## / && in_today_section {
    in_today_section = 0
}
/^### '"$CHANGE_TYPE"'/ && in_today_section {
    in_target_section = 1
    print $0
    next
}
/^### / && in_target_section {
    # Add entry before next section
    print "- " description
    print ""
    in_target_section = 0
    print $0
    next
}
/^## / && in_target_section {
    # Add entry before next major section
    print "- " description
    print ""
    in_target_section = 0
    print $0
    next
}
{ print }
END {
    if (in_target_section) {
        print "- " description
    }
}
' "$CHANGELOG_FILE" > "$TEMP_FILE"

mv "$TEMP_FILE" "$CHANGELOG_FILE"

# Format the changelog with Prettier to maintain consistent formatting
if command -v pnpm &> /dev/null; then
    pnpm exec prettier --write "$CHANGELOG_FILE" 2>/dev/null || true
elif command -v npx &> /dev/null; then
    npx prettier --write "$CHANGELOG_FILE" 2>/dev/null || true
fi

echo "✅ Updated changelog: $CHANGE_TYPE - $DESCRIPTION"