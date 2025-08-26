---
description: Debug and resolve bugs, errors, or issues using root-cause analysis
allowed-tools: Task
---

Debug and resolve bugs, errors, or issues using systematic root-cause analysis

## Usage

- `/fix [description]` - Analyze and fix the described issue
- Uses the **root-cause-analyzer** agent with **MCP servers priority**
- Leverages **mcp**serena**\*** for precise code analysis and editing

## Tech Stack Context

- **Svelte 5 runes**: $state, $derived, $effect patterns
- **SvelteKit 2**: SSR, routing, and build system
- **TypeScript strict**: No `any` types, full type safety
- **Tailwind v4**: Modern utility-first CSS
- **pnpm**: Package management and scripts

## Examples

- `/fix infinite loop in typing component`
- `/fix console errors on page load`
- `/fix memory leak when switching games`
- `/fix TypeScript errors after dependency update`
- `/fix performance degradation in game rendering`
- `/fix broken keyboard navigation`

## What it does

**CRITICAL**: Agent must use TodoWrite tool to track debugging progress and keep user informed

1. **Evidence Collection**: Gathers relevant logs, error traces, and symptoms
2. **Systematic Analysis**: Uses root-cause methodology to identify the fundamental issue
3. **Solution Implementation**: Fixes the underlying problem, not just symptoms
4. **Verification**: Tests the fix and ensures no new issues are introduced
5. **Quality Gates**: Runs `pnpm format && pnpm lint && pnpm check && pnpm build` before completion

**Progress Tracking**: Agent updates todo list showing investigation steps and fixes applied

## Best suited for

- Complex bugs that are hard to reproduce
- Mysterious errors with unclear causes
- Performance issues and memory leaks
- Build or compilation failures
- Integration problems between components
- TypeScript errors and configuration issues

**Tip**: Be specific about symptoms you're observing for better diagnosis
