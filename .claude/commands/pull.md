---
description: Execute git pull workflow to sync with remote repository
allowed-tools: Bash
---

Execute git pull workflow to fetch and merge latest changes from the remote repository.

This command handles pulling latest changes and provides status information:

```bash
# Pull latest changes from remote
git pull

# Show status after pull
git status

# Display recent commits for context
git log --oneline -5
```

**Process**: Fetches and merges changes from origin/main (or current tracking branch)  
**Output**: Shows files changed, commits pulled, and current repository status  
**Conflicts**: If merge conflicts occur, stops and shows conflict files for manual resolution  
**Safety**: Uses fast-forward when possible, creates merge commit when necessary

## Usage Examples

Standard pull:

```
/pull
```

This will:

1. Pull latest changes from remote repository
2. Show updated file status
3. Display recent commit history for context
4. Report any untracked files that need attention

**Note**: Always review changes after pull, especially if working in a team environment
