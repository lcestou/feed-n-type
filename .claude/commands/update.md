---
description: Check for outdated packages and update dependencies
allowed-tools: Bash
---

Check for outdated packages and update dependencies safely

Execute this command:

```bash
echo "=== Starting Update Process ===" && echo "Updating pnpm..." && npm install -g pnpm@latest && echo "Checking project packages..." && if pnpm outdated --format=json | grep -q '"current"'; then echo "Updates found - proceeding with installation..." && pnpm update && pnpm install && echo "=== Running Quality Checks ===" && pnpm format && pnpm lint && pnpm check && pnpm build && echo "=== Update Complete ==="; else echo "All packages up to date - no quality checks needed" && echo "=== Update Complete ==="; fi
```

## What it does

1. **Update pnpm**: Updates pnpm package manager to latest version
2. **Check Outdated**: Shows which project packages have updates available
3. **Conditional Updates**: Only proceeds with updates and quality checks if packages need updating
4. **Smart Workflow**: Skips unnecessary quality gates when no packages were updated
5. **Quality Gates**: Runs format, lint, check, and build only when changes were made
6. **Safety**: Only updates to compatible versions (respects semver ranges)

## When to use

- Regular maintenance to keep dependencies current
- Before major development work
- After security alerts about vulnerable packages
- Monthly dependency hygiene

## Safety Features

- **Semver Respect**: Only updates within your specified version ranges
- **Quality Verification**: Ensures updates don't break your build
- **Full Testing**: Runs complete quality pipeline after updates

**Warning**: Review breaking changes for major version updates before running
