---
description: Create PR and merge workflow for non-main branches
allowed-tools: Bash
---

Execute the complete merge workflow for non-main branches.

This command handles PR creation and merging via GitHub:

```bash
# Get current branch name
CURRENT_BRANCH=$(git branch --show-current)

# Create PR with title and body
gh pr create --base main --head $CURRENT_BRANCH \
  --title "feat: $(echo $CURRENT_BRANCH | sed 's/.*\///')" \
  --body "Auto-generated PR from branch $CURRENT_BRANCH"

# Merge via GitHub (requires PR approval/checks)
gh pr merge --merge
```

**Requirements**: Must be on non-main branch
**Process**: Creates PR first, then merges via GitHub
**Note**: Post-merge PRs acceptable for documentation updates
