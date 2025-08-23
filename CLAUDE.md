# CLAUDE.md

This file provides guidance to Claude Code (claude.ai/code) when working with code in this repository.

## 🚨 CRITICAL: ALWAYS FOLLOW WORKFLOW RULES BELOW 🚨

**Role**: Parse → Route → Coordinate → Brief responses  
**Simple**: Delegate immediately | **Complex**: Plan → Multi-agent → Quality gates  
**Rule**: Stay concise - agents handle detailed work

## Project Overview

Feed & Type is a gamified typing learning tool built with SvelteKit (Svelte 5) and TypeScript. It makes typing practice engaging by using content from topics kids care about (Minecraft, Roblox, Pokemon, etc.) instead of boring phrases.

The application will:

1. Allow users to select content feeds (games, topics)
2. Fetch/display content from these feeds
3. Track typing progress and accuracy
4. Dynamically expand content as users complete sections
5. Gamify the experience with achievements and progress tracking

## Agent Specialists

**🏗️ systems-architect**: Architecture, system design, tech migrations  
**🎨 frontend-ui-specialist**: UI/UX, accessibility, responsive design  
**⚙️ backend-api-specialist**: APIs, database, auth, server logic  
**🔍 root-cause-analyzer**: Complex debugging, system failures  
**🧪 qa-testing-specialist**: Test strategy, quality gates, edge cases  
**🛡️ security-threat-analyzer**: Security audits, vulnerabilities  
**⚡ performance-optimizer**: Speed, bundle size, memory optimization  
**🔄 code-refactorer**: Technical debt, legacy modernization  
**🚀 devops-infrastructure-specialist**: CI/CD, deployment, infrastructure  
**👨‍🏫 learning-mentor**: Educational guidance, concept explanations  
**✍️ technical-documentation-writer**: Docs, API references, PRs  
**🔮 product-strategist**: Product planning, market analysis

## Development Environment

This project uses Docker containers for development with automatic NAS mounting support.

### Tech Stack

- **Framework**: SvelteKit with Svelte 5
- **Language**: TypeScript
- **Package Manager**: pnpm
- **Linting**: oxlint (to be configured)
- **Container**: Node 22 on Debian Bookworm

### Common Commands

- **Development server**: `dev` (opens browser automatically)
- **Build**: `pnpm run build`
- **Preview**: `pnpm run preview`
- **Type checking**: `pnpm run check`
- **Linting**: `pnpm run lint`
- **Tests**: `pnpm run test` or `pnpm run test:unit`

**Note**: pnpm is configured to use the default local store location (`~/.local/share/pnpm`) for optimal performance. Build scripts are enabled globally.

### Port Configuration

Development server runs on port 5173 (exposed through Docker). Additional ports 5174-5178 are available for other services.

### Project Structure

Currently a skeleton project. Main development will happen in:

- `/src/routes/` - SvelteKit routes and pages
- `/src/lib/` - Shared components and utilities
- `/static/` - Static assets

## Critical Rules & Context

**MCP Servers**: Always use MCP servers first (see `docs/mcp-servers.md` for complete reference)  
**Files**: Read first, verify exists, copy WITHOUT line numbers, exact paths from `/app/projects/svelte-infinity_concepts/`, max 3 files per task (keep context manageable)  
**Tech**: Svelte 5 runes + SvelteKit 2 + TS strict + Tailwind v4 + pnpm  
**State**: Svelte 5 runes for new, legacy stores for existing  
**Commands**: `pnpm build|check` (format/lint auto-run via hooks)  
**Branches**: `feat/description`, `docs/updates`, `hotfix/description` (naming based on task/request)  
**Quality**: check→build→verify→approval (lint/format automated, install deps if needed)  
**Code**: TS strict, no `any`, follow conventions, remove console.logs, edit existing only  
**Formatting**: Project uses TABS not spaces - maintain exact indentation when editing (auto-formatted)  
**Regex**: See `.claude/REGEX-ESCAPING-GUIDE.md` - MultiEdit uses `/\d/`, Serena uses `\\\\d`, context matters!  
**Context**: /clear between major tasks | Single atomic changes | Chain git operations when user requests push  
**🚨 MANDATORY Git Rules**: When user says "push" ALWAYS run this EXACT sequence:
1. `pnpm check` → `pnpm build` (verify code quality)
2. Run `uv run ./.claude/hooks/changelog_reminder.py` to analyze changes (detects modified files, categorizes changes, suggests commit topics)
3. Based on the script's analysis, craft an intelligent commit message that reflects actual changes
4. Run `uv run ./.claude/hooks/changelog_reminder.py --auto-update` to update CHANGELOG.md
5. `git add -A` → commit with crafted message → push
Fix any errors before proceeding | User must explicitly request push  
**PR Workflow**: When user says "merge" on any non-main branch: create PR first with `gh pr create --base main --head <branch> --title --body`, then merge via GitHub | Post-merge PRs acceptable for documentation  

## Automation

- ✅ **Auto**: format/lint (PostToolUse hooks), browser error monitoring
- 🚫 **Pre-Push Gates**: `pnpm check|build` (blocks push if failed)
- 🔧 **Manual**: tests, security scans, complex debugging

## Agent Guidelines

**Agent Handoffs**: When delegating to subagents, provide exact file paths, specific tools to use, clear context, and precise instructions to ensure task success  
**Recovery**: If regex/escape errors occur, /clear and restart with simpler approach