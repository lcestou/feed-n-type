---
description: Execute the complete push workflow with quality gates
allowed-tools: Bash
---

Execute the complete push workflow with quality gates and changelog updates.

This command runs the mandatory git push sequence exactly like below:

```bash
# Quality gates
pnpm format && pnpm lint
pnpm check && pnpm build

# Analyze changes and update changelog
uv run ./.claude/hooks/changelog_reminder.py
uv run ./.claude/hooks/changelog_reminder.py --auto-update

# Commit and push with manual message
git add -A
git commit -m "docs: Update project configuration and documentation"
git push
```

**Quality Gates**: Blocks push if `pnpm check` or `pnpm build` fails
**Changelog**: Automatically analyzes changes and updates CHANGELOG.md
**Commit Message**: Intelligently crafted based on actual file changes
