---
description: Implement new features with proper UI/UX, accessibility, and performance
allowed-tools: Task
---

Implement new features using specialized agents with modern tech stack

## Usage

- `/feat [description]` - Design and implement the described feature
- **MCP servers priority**: Uses **mcp**serena**\*** for code operations
- Automatically selects appropriate agent(s) based on feature type

## Tech Stack Enforcement

- **Svelte 5 runes**: $state, $derived, $effect (no legacy stores)
- **SvelteKit 2**: Modern routing, SSR, and preloading patterns
- **TypeScript strict**: Comprehensive type safety, no `any`
- **Tailwind v4**: Utility-first with proper cursor behaviors
- **Accessibility**: WCAG 2.1 AA compliance built-in

## Examples

- `/feat implement a modal that shows game statistics`
- `/feat add dark mode toggle to settings`
- `/feat create difficulty selection screen`
- `/feat add sound effects and audio controls`
- `/feat implement local storage for user progress`
- `/feat create animated typing feedback system`
- `/feat add multiplayer competitive mode`

## Agent Selection

**Frontend UI Features** (primary): Uses **frontend-ui-specialist**

- UI components, modals, screens, visual effects
- Accessibility, responsive design, user interactions

**Performance Features**: Uses **performance-optimizer**

- Loading optimizations, bundle size improvements
- Memory management, rendering optimizations

**Backend Features**: Uses **backend-api-specialist**

- API integrations, data persistence
- Authentication, server-side logic

**System Architecture**: Uses **systems-architect**

- Major architectural changes, large feature sets
- Multi-component integrations, scalability planning

## What it does

**CRITICAL**: Agent must use TodoWrite tool to track progress and keep user informed

1. **Requirements Analysis**: Understands feature scope and user needs
2. **Agent Selection**: Chooses optimal specialist agent for the task
3. **Implementation**: Builds feature following modern Svelte 5 + TypeScript patterns
4. **Quality Assurance**: Ensures accessibility, performance, and code quality
5. **Integration**: Seamlessly integrates with existing codebase
6. **Verification**: Tests functionality and runs quality gates
7. **Quality Cleanup**: Runs `pnpm format && pnpm lint && pnpm check && pnpm build` before completion

**Progress Tracking**: Agent updates todo list at each step, marking tasks completed as they finish

## Implementation Standards

- **MCP Tools**: Prioritize mcp**serena** for all code operations
- **Svelte 5 runes**: $state, $derived, $effect (NO legacy patterns)
- **TypeScript strict**: Zero tolerance for `any`, full type coverage
- **Tailwind v4**: Modern utilities, proper cursor behaviors
- **WCAG 2.1 AA**: Accessibility-first development
- **Performance**: <500KB initial, <3s TTI, mobile-optimized
- **Quality gates**: Auto-format, lint, check, build verification

## Built-in Code Quality

- **Semantic IDs**: Every element gets descriptive IDs (header-nav, game-area, score-display)
- **JSDoc Required**: All functions, components, and types get comprehensive documentation
- **Debugging Ready**: `data-debug`, `data-perf` attributes for troubleshooting
- **Gaming Context**: Kid-friendly examples, accessibility notes in docs

**Tip**: Describe the user experience and behavior you want - the agents will handle technical implementation
