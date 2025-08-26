---
description: Improve code quality, reduce technical debt, and modernize code patterns
allowed-tools: Task
---

Improve code quality and modernize to current tech stack standards

## Usage

- `/refactor [description]` - Clean up and improve code structure
- Uses **code-refactorer** with **MCP servers priority**
- Leverages **mcp**serena**\*** for precise symbol-level refactoring

## Modernization Targets

- **Svelte 4→5**: Convert stores to runes ($state, $derived, $effect)
- **Legacy patterns**: Update to modern SvelteKit 2 conventions
- **TypeScript**: Eliminate `any`, improve type coverage
- **Tailwind v4**: Update classes, fix cursor behaviors

## Examples

- `/refactor clean up messy component with nested logic`
- `/refactor eliminate code duplication in game logic`
- `/refactor modernize to Svelte 5 runes patterns`
- `/refactor improve variable and function naming`
- `/refactor extract reusable utilities from components`
- `/refactor simplify complex state management`
- `/refactor organize imports and file structure`

## What it does

**CRITICAL**: Agent must use TodoWrite tool to track refactoring progress and keep user informed

1. **Code Analysis**: Reviews existing code for improvement opportunities
2. **Pattern Recognition**: Identifies outdated patterns and technical debt
3. **Modernization**: Updates to current Svelte 5 and TypeScript best practices
4. **Structure Improvement**: Organizes code for better maintainability
5. **Duplication Removal**: Consolidates repeated logic into reusable functions
6. **Naming Enhancement**: Improves clarity through better naming conventions
7. **Quality Gates**: Runs `pnpm format && pnpm lint && pnpm check && pnpm build` before completion

**Progress Tracking**: Agent updates todo showing files refactored and patterns modernized

## Refactoring Focus Areas

- **MCP Operations**: Uses mcp**serena** for symbol-based refactoring
- **Svelte 5 Migration**: Stores→runes, reactive statements→derived
- **TypeScript Strict**: Zero `any` tolerance, comprehensive typing
- **SvelteKit 2**: Modern routing, load functions, form actions
- **Tailwind v4**: Class updates, cursor behavior fixes
- **Component Architecture**: Props typing, event handling, composition
- **Performance**: Eliminate unnecessary reactivity, optimize renders
- **Gaming Logic**: Clean typing mechanics, score calculations

## Best suited for

- Legacy code that needs modernization
- Complex components with tangled logic
- Repeated code patterns across files
- Poor naming or unclear code structure
- Technical debt that slows development
- Migration to newer framework patterns
- Code that's hard to test or maintain

**Tip**: Point to specific files or describe the code complexity issues you want to address
