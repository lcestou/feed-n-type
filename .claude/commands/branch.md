Create and switch to a new git branch with intelligent naming

## Usage: `/branch <description>`

Creates a new branch with automatic prefix based on description keywords and switches to it.

## Branch Naming Convention

Automatically detects branch type from description:

- **feat/** - Features, additions, enhancements
- **fix/** - Bug fixes, corrections, repairs
- **docs/** - Documentation updates
- **style/** - UI/UX, styling, formatting
- **refactor/** - Code refactoring, cleanup
- **test/** - Testing additions or fixes
- **chore/** - Maintenance, dependencies, configs
- **hotfix/** - Urgent production fixes

## Examples

```bash
/branch keyboard features for menu
# Creates: feat/keyboard-features-for-menu

/branch fix typing speed calculation
# Creates: fix/typing-speed-calculation

/branch update documentation for api
# Creates: docs/documentation-for-api

/branch refactor component structure
# Creates: refactor/component-structure
```

## Workflow

1. **Analyze description** - Determine branch type from keywords
2. **Format branch name** - Convert to kebab-case with prefix
3. **Create branch** - `git checkout -b <branch-name>`
4. **Confirm switch** - Show current branch status

## Implementation

```bash
# Parse description for branch type
if [description contains "feat", "add", "new", "enhance"]:
    prefix = "feat/"
elif [description contains "fix", "bug", "repair", "correct"]:
    prefix = "fix/"
elif [description contains "docs", "documentation", "readme"]:
    prefix = "docs/"
elif [description contains "style", "ui", "css", "design"]:
    prefix = "style/"
elif [description contains "refactor", "cleanup", "reorganize"]:
    prefix = "refactor/"
elif [description contains "test", "spec", "testing"]:
    prefix = "test/"
elif [description contains "hotfix", "urgent", "critical"]:
    prefix = "hotfix/"
else:
    prefix = "chore/"

# Convert description to kebab-case
branch_name = prefix + description.toLowerCase().replace(/\s+/g, '-')

# Create and switch to branch
git checkout -b branch_name
```

## Safety Features

- **Validates** current git status before creating branch
- **Checks** for uncommitted changes and prompts to stash
- **Prevents** duplicate branch names
- **Confirms** successful branch creation and switch

## Related Commands

- `/push` - Push changes to remote
- `/merge` - Create pull request
- `/dev` - Start development server
