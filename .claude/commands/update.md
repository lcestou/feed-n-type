---
description: Check for outdated packages and update dependencies
allowed-tools: Bash
---

Check for outdated packages and update dependencies safely

Execute this command:

```bash
echo "Updating pnpm..." && npm install -g pnpm@latest && echo "Checking project packages..." && pnpm outdated && echo "Updating packages..." && pnpm update && pnpm install && echo "Running quality checks..." && pnpm format && pnpm lint && pnpm check && pnpm build
```

## What it does

1. **Update pnpm**: Updates pnpm package manager to latest version
2. **Check Outdated**: Shows which project packages have updates available
3. **Update Packages**: Updates dependencies to latest compatible versions
4. **Install**: Ensures all dependencies are properly installed
5. **Quality Gates**: Runs format, lint, check, and build to verify everything works
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
