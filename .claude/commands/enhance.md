---
description: Enhance code with semantic IDs and comprehensive JSDoc documentation
allowed-tools: Task
argument-hint: '[number] [ids|docs]'
---

Systematically enhance src/ folder with semantic IDs and JSDoc documentation

## Usage

- `/enhance` - Both semantic IDs and JSDoc with 2 agents
- `/enhance 4` - Both tasks with 4 agents (2 each) for speed
- `/enhance ids` - Only semantic IDs with 2 agents
- `/enhance docs` - Only JSDoc with 2 agents
- `/enhance 4 ids` - Only semantic IDs with 4 agents
- `/enhance 6 docs` - Only JSDoc with 6 agents

## What it does

**CRITICAL**: Each agent must use TodoWrite tool to track file progress and keep user informed

1. **File Discovery**: Scans src/ for Svelte, TypeScript, and JavaScript files
2. **Agent Distribution**: Divides files among specified agents to avoid conflicts
3. **Parallel Processing**: Runs multiple agents simultaneously for speed
4. **Semantic IDs**: Adds descriptive IDs like header-nav, game-area, score-display
5. **JSDoc Enhancement**: Comprehensive function, component, and type documentation
6. **Quality Gates**: Runs `pnpm format && pnpm lint && pnpm check && pnpm build` before completion

**Progress Tracking**: Agents update todo with "Processing file X of Y" and mark files completed

## Semantic ID Strategy

- **Descriptive IDs**: `id="header-nav"`, `id="game-area"`, `id="score-display"`
- **Pattern**: element-purpose or section-function naming
- **Game Elements**: `id="typing-area"`, `id="virtual-keyboard"`, `id="progress-bar"`
- **UI Sections**: `id="settings-panel"`, `id="leaderboard"`, `id="user-profile"`
- **Testing Support**: `data-testid="score-display"` (matches ID for consistency)

### Benefits

- Easy debugging: Find elements by meaningful names in DevTools
- Clear CSS targeting: `.score-display { }` styles
- Self-documenting HTML structure
- Automated testing compatibility

## JSDoc Standards

- **Svelte Components**: Props, events, slots, examples
- **Functions**: Parameters, returns, throws, examples
- **TypeScript**: Interfaces, types, generics documentation
- **Game Logic**: Algorithm explanations, performance notes

## Tech Stack Integration

- **MCP Priority**: Uses **mcp**serena**\*** for precise file operations
- **Svelte 5**: Runes-aware documentation patterns
- **TypeScript**: Comprehensive type documentation
- **Gaming Context**: Kid-friendly examples, accessibility notes

## Examples

```bash
/enhance           # 2 agents, both tasks
/enhance 4         # 4 agents for speed
/enhance ids       # Only semantic IDs
/enhance 4 docs    # 4 agents, only JSDoc
```

## Best suited for

- Post-development code enhancement
- Preparing for debugging sessions
- Improving code maintainability
- Team onboarding preparation
- Accessibility compliance checking

**Tip**: Use higher agent counts (4-6) for large codebases to speed up processing
