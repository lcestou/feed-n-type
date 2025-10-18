---
description: Execute git push workflow with optional quick mode
allowed-tools: Bash, Task, TodoWrite
---

Execute automated git push workflow with two modes:

## Standard Mode: `/push`

Automated workflow with quality gates and changelog updates:

1. Run quality gates: `pnpm format && pnpm lint && pnpm check && pnpm build`
2. Automatically update CHANGELOG.md using technical-documentation-writer agent
3. Analyze changes and craft intelligent commit message based on actual file changes
4. Commit and push all changes

**Quality Gates**: Blocks push if any quality gate fails
**Changelog**: Automatically updated via technical-documentation-writer agent
**Commit Message**: Intelligently crafted based on git diff analysis
**Automation**: Fully automated, no manual intervention required

## Quick Mode: `/push quick`

For simple changes that don't need full validation:

1. Automatically update CHANGELOG.md using technical-documentation-writer agent
2. Analyze changes and craft commit message
3. Commit and push all changes

**Use Cases**: Documentation updates, config files, new non-code files
**Includes**: Automated changelog updates
**Skips**: Quality gates (formatting, linting, type checking, build)
**Warning**: Only use when confident changes don't affect code functionality

## Implementation Notes

- Use TodoWrite to track workflow steps
- Use Task with technical-documentation-writer to update CHANGELOG.md
- Analyze git diff to create descriptive commit messages
- Handle build failures by fixing issues before retrying
