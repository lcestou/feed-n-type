<!-- Sync Impact Report
Version change: [NEW] → 1.0.0
Added sections: All new constitution
Modified principles: N/A (initial creation)
Templates requiring updates: ✅ All templates to be reviewed
Follow-up TODOs: RATIFICATION_DATE needs confirmation
-->

# Feed-n-Type Constitution

## Core Principles

### I. MCP-Driven Development (NON-NEGOTIABLE)

**ALWAYS** use mcp\_\_svelte-llm MCP server for ANY Svelte 5 implementation. **NEVER** write Svelte code from memory - fetch official docs via MCP first. **ALWAYS** call list_sections then get_documentation for relevant Svelte features. **VERIFY** all rune usage ($state, $derived, $effect) against official documentation.

**Rationale**: The developer is a designer/vibecoder who needs production-ready, flawless code on first attempt. MCP ensures accuracy over assumptions.

### II. Child Safety First

Age range 7-12 years with zero personal data collection. Content sources limited to Pokemon, Nintendo, Roblox official feeds only. No social features, chat, or user-generated content sharing. All data stored locally with no external transmission except content feed fetches.

**Rationale**: Children's privacy and safety supersede all other features. Parents must trust the platform completely.

### III. Positive Gamification

Virtual pet companion thrives on consistent practice, not perfection. Typing accuracy weighted 3x more than speed for proper habit formation. Mistakes are learning moments with gentle corrections, never punishments. Streak system with forgiving catch-up mechanics for missed days.

**Rationale**: Building confidence and good habits matters more than competitive pressure. Children learn best through encouragement.

### IV. TypeScript Strict Mode

Zero tolerance for 'any' types in TypeScript. All variables must be explicitly typed. Svelte 5 with runes (no stores) - consult MCP docs for EVERY rune. Component-first architecture with <5 props per component.

**Rationale**: Type safety prevents runtime errors that frustrate non-technical users. Clean component interfaces reduce complexity.

### V. Quality Gates (MANDATORY)

Every implementation MUST pass: pnpm check → pnpm build → manual test. Components must render without errors in dev mode. No console errors or warnings in browser. Maximum 200KB JavaScript bundle (before gzip).

**Rationale**: The developer cannot debug complex issues. Code must work perfectly or not ship at all.

## Visual & Interaction Standards

### Design Language

Primary palette: bright, high-contrast colors meeting WCAG AAA standards. Typography: Inter or system fonts at 18px+ base size. Spacing: 8px grid system with generous 48px minimum touch targets. Feedback: haptic-style micro-animations on every interaction. Characters: friendly mascot with 10+ emotional states. Sound: optional 8-bit style effects with master volume control.

### Performance Requirements

60fps animations using CSS transforms, not JavaScript. Mobile-first responsive design with touch gesture support. ARIA labels and keyboard navigation on all interactive elements. Lighthouse score 90+ for performance and accessibility. Local storage only - no external APIs except content feeds.

## Development Workflow

### Implementation Process

1. Consult MCP documentation BEFORE writing any Svelte component
2. Write component with TypeScript strict mode enforcement
3. Run pnpm check to catch type errors
4. Run pnpm build to verify production build
5. Manual test in dev mode for visual/interaction verification
6. Commit only after all gates pass

### Code Review Standards

Every PR must demonstrate MCP documentation was consulted (reference sections used). Type safety verification required (no any types, all props typed). Quality gates must show passing status. Parent-friendly feature descriptions required (explain like they're 5).

## Governance

The Constitution supersedes all development practices and personal preferences. Amendments require documented rationale and migration plan for existing code. All implementations must verify compliance before merging.

When in doubt, check the MCP documentation. Never assume, always verify. The developer needs working code on first attempt.

**Version**: 1.0.0 | **Ratified**: TODO(RATIFICATION_DATE) | **Last Amended**: 2025-01-21
