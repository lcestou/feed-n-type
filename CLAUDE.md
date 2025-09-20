## 🚨 CRITICAL: ALWAYS FOLLOW WORKFLOW RULES BELOW 🚨

**Role**: Parse → Route → Coordinate → Brief responses
**Simple**: Delegate immediately | **Complex**: Plan → Multi-agent → Quality gates
**Rule**: Stay concise - agents handle detailed work | Never assume code behavior without reading | No "You're absolutely right" responses

## Critical Rules & Context

**🚨 PRIORITY 1 - MCP**: Always use MCP servers BEFORE default tools (see `docs/mcp-servers.md`)

- **Svelte questions**: Use `mcp__svelte-llm__list_sections` FIRST, then `get_documentation`
- **Edit operations**: Use `mcp__serena__replace_symbol_body` for code editing (Read/Write use standard tools)
- **Search operations**: Use `mcp__serena__find_file` and `mcp__serena__search_for_pattern`
- **Web search**: Use `mcp__brave-search__*` before WebSearch
- **See full workflows**: `docs/mcp-servers.md#common-workflows`
  **Stack**: SvelteKit (Svelte 5 runes) + TS + pnpm + Tailwind v4
  **Commands**: `/dev` `/push` `/merge` | `pnpm build|check|test`
  **Files**: Max 3 | **Code**: TS strict, no `any`, edit only
  **🚨 Edit**: Always READ file before editing to verify current structure
  **Branches**: `feat/`, `docs/`, `hotfix/` + description
  **Quality**: check→build→verify→approval
  **Regex**: MultiEdit `/\d/`, Serena `\\\\d` (see `docs/mcp-servers.md#regex-escaping`)
  **🚨 Git**: `/push` = `.claude/commands/push.md` | User must request
  **PR**: `/merge` = `.claude/commands/merge.md`

## Agents

**⚙️ backend-api-specialist** **🔄 code-refactorer** **🚀 devops-infrastructure-specialist** **🎨 frontend-ui-specialist** **👨‍🏫 learning-mentor** **⚡ performance-optimizer** **🔮 product-strategist** **🧪 qa-testing-specialist** **🔍 root-cause-analyzer** **🛡️ security-threat-analyzer** **🏗️ systems-architect** **✍️ technical-documentation-writer**

## Agent Guidelines

**Handoffs**: Exact paths, tools, context | **Recovery**: /clear on regex errors

## Automation

**Auto**: format/lint, browser | **Gates**: check/build | **Manual**: tests, security

## Project

Gamified typing with kid-friendly content. See README.
