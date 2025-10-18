## 🚨 CRITICAL RULES - READ FIRST 🚨

**🔴 ALWAYS READ files before editing** - Use Read tool first, then Edit/MultiEdit
**🔴 ALWAYS use MCP for Svelte 5** - `mcp__svelte` → `list-sections` → `get-documentation` → `svelte-autofixer`
**🔴 NEVER use 'any' types** - TypeScript strict mode enforced
**🔴 QUALITY GATES** - Must pass: `bun check` → `bun run build` → manual test

## Project: Feed-n-Type

**Current**: Feature 001-build-a-gamified | Branch: `001-build-a-gamified`
**Goal**: Gamified typing trainer for kids 7-12 with virtual pet Typingotchi
**Next Step**: `/tasks` command ready

### Key Files

- **Existing Working Code** (DO NOT BREAK):
  - `src/routes/+page.svelte` - Main typing trainer
  - `src/lib/components/TypingArea.svelte` - Text display
  - `src/lib/components/VirtualKeyboard.svelte` - Keyboard UI
  - `src/lib/components/Typingotchi.svelte` - Pet component
- **Specs**: `/specs/001-build-a-gamified/` (spec.md, plan.md, contracts/)
- **Future**: `/specs/future-features-roadmap.md` (8 planned features)

## Tech Stack

- **Frontend**: SvelteKit + Svelte 5 runes (NO stores) + TypeScript strict + Tailwind v4
- **Storage**: Local only (IndexedDB + localStorage)
- **Privacy**: Zero external data transmission

## MCP Priority

1. **Svelte**: `mcp__svelte__list-sections` → `get-documentation` → `svelte-autofixer`
2. **Search**: `mcp__serena__find_file`, `mcp__serena__search_for_pattern`
3. **Edit**: `mcp__serena__replace_symbol_body` for symbols, Edit/MultiEdit for lines
4. **Web**: `mcp__brave-search__*` before WebSearch

## Commands & Workflow

- **Dev**: `/dev` (starts server) | Build: `bun run build|check|test`
- **Git**: `/push` (requires user request) | `/merge` (PR creation)
- **Branches**: `feat/`, `docs/`, `hotfix/` + description
- **Agents**: Use for complex tasks (see agent list in docs)

## Quick Rules

- Parse → Route → Coordinate → Brief responses
- Max 3 files per operation
- Edit existing code, don't replace
- No "You're absolutely right" responses
- See `docs/mcp-servers.md` for full workflows
