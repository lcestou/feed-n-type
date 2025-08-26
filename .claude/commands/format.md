---
description: Quick code formatting and linting cleanup
allowed-tools: Bash
---

Run code formatting and linting for quick cleanup

Execute this command:

```bash
pnpm format && pnpm lint
```

## What it does

- **Format**: Runs Prettier to fix code formatting
- **Lint**: Runs ESLint and Oxlint to check code quality
- **Quick**: Fast cleanup without full quality gates

## When to use

- After manual code edits or copy-paste operations
- Before starting work to ensure clean baseline
- Quick cleanup without running full command workflows
- Debugging formatting or linting issues

**Tip**: Use this for quick cleanups - full commands include comprehensive quality gates
