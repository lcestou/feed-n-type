---
description: Execute git push workflow with optional quick mode
allowed-tools: Bash
---

Execute git push workflow with two modes:

## Standard Mode: `/push`

Runs the complete push workflow with quality gates and changelog updates:

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

## Quick Mode: `/push quick`

For simple changes (new files, documentation, configs) that don't need full validation:

```bash
# Analyze changes and update changelog
uv run ./.claude/hooks/changelog_reminder.py
uv run ./.claude/hooks/changelog_reminder.py --auto-update

# Quick commit and push
git add -A
git commit -m "docs: Update project configuration and documentation"
git push
```

**Use Cases**: Documentation updates, config files, new non-code files  
**Includes**: Changelog updates to maintain project history  
**Skips**: Quality gates (formatting, linting, type checking, and build verification)  
**Warning**: Only use when confident changes don't affect code functionality
