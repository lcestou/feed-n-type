---
description: Execute the complete push workflow with quality gates
allowed-tools: Bash
---

Execute the complete push workflow with quality gates and changelog updates.

This command runs the mandatory git push sequence:

```bash
# Quality gates
pnpm check && pnpm build

# Analyze changes and update changelog
uv run ./.claude/hooks/changelog_reminder.py
uv run ./.claude/hooks/changelog_reminder.py --auto-update

# Commit and push with intelligent message
git add -A
git commit -m "$(uv run ./.claude/hooks/changelog_reminder.py --commit-message)"
git push
```

**Quality Gates**: Blocks push if `pnpm check` or `pnpm build` fails
**Changelog**: Automatically analyzes changes and updates CHANGELOG.md
**Commit Message**: Intelligently crafted based on actual file changes