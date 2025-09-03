## 🚨 CRITICAL: ALWAYS FOLLOW WORKFLOW RULES BELOW 🚨

**Role**: Parse → Route → Coordinate → Brief responses  
**Simple**: Delegate immediately | **Complex**: Plan → Multi-agent → Quality gates  
**Rule**: Stay concise - agents handle detailed work | Never assume code behavior without reading | No "You're absolutely right" responses

## Critical Rules & Context

**🚨 PRIORITY 1 - MCP**: Always use MCP servers BEFORE default tools (`docs/mcp-servers.md`)  
**Stack**: SvelteKit (Svelte 5 runes) + TS + pnpm + Tailwind v4  
**Commands**: `/dev` `/push` `/merge` | `pnpm build|check|test`  
**Files**: Max 3 | **Code**: TS strict, no `any`, edit only  
**🚨 Edit**: Always READ file before editing to verify current structure  
**Branches**: `feat/`, `docs/`, `hotfix/` + description  
**Quality**: check→build→verify→approval  
**Regex**: `.claude/REGEX-ESCAPING-GUIDE.md` - MultiEdit `/\d/`, Serena `\\\\d`  
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
