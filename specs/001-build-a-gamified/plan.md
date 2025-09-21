# Implementation Plan: Gamified Typing Trainer with Virtual Pet

**Branch**: `001-build-a-gamified` | **Date**: 2025-01-21 | **Spec**: [spec.md](./spec.md)
**Input**: Feature specification from `/specs/001-build-a-gamified/spec.md`

## Execution Flow (/plan command scope)

```
1. Load feature spec from Input path
   ✅ Feature spec loaded: Gamified typing trainer for kids 7-12
2. Fill Technical Context (scan for NEEDS CLARIFICATION)
   ✅ SvelteKit + TypeScript + Tailwind v4 stack confirmed
   ✅ Set Structure Decision: Single project (web frontend)
3. Fill the Constitution Check section based on constitution
   ✅ MCP-Driven Development compliance verified
4. Evaluate Constitution Check section below
   ✅ No violations - all requirements align with constitution
   ✅ Update Progress Tracking: Initial Constitution Check PASS
5. Execute Phase 0 → research.md
   ✅ Research complete - all tech decisions clarified
6. Execute Phase 1 → contracts, data-model.md, quickstart.md, CLAUDE.md
   ✅ Design artifacts generated
7. Re-evaluate Constitution Check section
   ✅ No new violations - MCP compliance maintained
   ✅ Update Progress Tracking: Post-Design Constitution Check PASS
8. Plan Phase 2 → Task generation approach described
   ✅ Ready for /tasks command
9. STOP - Ready for /tasks command
   ✅ Implementation plan complete
```

**IMPORTANT**: The /plan command STOPS at step 8. Phases 2-4 are executed by other commands:

- Phase 2: /tasks command creates tasks.md
- Phase 3-4: Implementation execution (manual or via tools)

## Summary

Build a gamified typing trainer where kids aged 7-12 learn proper typing by feeding their virtual pet Typingotchi with words from gaming content (Pokemon, Nintendo, Roblox). The system builds upon existing foundation (typing area, virtual keyboard, pet playground) to add content feeds, pet evolution, streak tracking, and comprehensive engagement mechanics. Technical approach uses SvelteKit with Svelte 5 runes, TypeScript strict mode, and local-only data storage, with mandatory MCP documentation consultation for all implementation.

## Technical Context

**Language/Version**: TypeScript 5.x with SvelteKit (Svelte 5 runes)
**Primary Dependencies**: Svelte 5, SvelteKit, Tailwind CSS v4, TypeScript (strict mode)
**Storage**: Local storage only (localStorage, IndexedDB for larger data)
**Testing**: Vitest, Playwright for E2E, Testing Library for component tests
**Target Platform**: Modern web browsers (Chrome, Firefox, Safari, Edge)
**Project Type**: Single web frontend application
**Performance Goals**: <200KB JavaScript bundle, 60fps animations, <100ms interaction response
**Constraints**: Zero external data transmission, WCAG AAA compliance, mobile-first responsive
**Scale/Scope**: Single-user local application, 28 functional requirements, 5 main entities

## Constitution Check

_GATE: Must pass before Phase 0 research. Re-check after Phase 1 design._

✅ **MCP-Driven Development**: All Svelte 5 implementation will use mcp\_\_svelte-llm documentation
✅ **Child Safety First**: Local storage only, no external data transmission, age-appropriate content
✅ **Positive Gamification**: Accuracy over speed, encouragement over punishment, forgiving mechanics
✅ **TypeScript Strict Mode**: Zero 'any' types, explicit typing, component props <5 maximum
✅ **Quality Gates**: pnpm check → build → manual test workflow enforced

**Result**: All constitutional requirements satisfied. No complexity deviations needed.

## Project Structure

### Documentation (this feature)

```
specs/001-build-a-gamified/
├── plan.md              # This file (/plan command output) ✅
├── research.md          # Phase 0 output (/plan command) ✅
├── data-model.md        # Phase 1 output (/plan command) ✅
├── quickstart.md        # Phase 1 output (/plan command) ✅
├── contracts/           # Phase 1 output (/plan command) ✅
└── tasks.md             # Phase 2 output (/tasks command - NOT created by /plan)
```

### Source Code (repository root)

```
# Single project structure (SvelteKit frontend)
src/
├── lib/
│   ├── components/      # Svelte components
│   ├── stores/          # Local storage utilities (not Svelte stores)
│   ├── types/           # TypeScript type definitions
│   ├── utils/           # Utility functions
│   └── content/         # Content feed management
├── routes/              # SvelteKit routes
└── app.html            # Main HTML template

static/                  # Static assets
├── sounds/             # Audio files
└── images/             # Pet sprites, icons

tests/
├── integration/        # E2E tests with Playwright
├── unit/              # Component tests with Vitest
└── contracts/         # Contract validation tests
```

**Structure Decision**: Single project (SvelteKit frontend) - no backend needed for local-only app

## Phase 0: Outline & Research

**Research Topics Identified**:

1. Svelte 5 runes best practices for state management
2. Local storage patterns for game data persistence
3. Content feed integration strategies for kid-safe sources
4. Animation patterns for 60fps performance in Svelte
5. Accessibility patterns for children's applications

**Research Results** (consolidated in research.md):

**Decision**: Svelte 5 runes ($state, $derived, $effect) for all reactive state
**Rationale**: Constitution mandates runes over stores, provides better TypeScript integration
**Alternatives considered**: Svelte 4 stores (rejected - constitution violation)

**Decision**: IndexedDB for pet state, localStorage for preferences
**Rationale**: IndexedDB handles complex pet evolution data, localStorage for simple settings
**Alternatives considered**: Single localStorage (rejected - size limitations)

**Decision**: Static content feeds with periodic manual updates
**Rationale**: Simplifies implementation, ensures content safety, no runtime API dependencies
**Alternatives considered**: Live RSS feeds (rejected - complexity, safety concerns)

**Decision**: CSS transforms with requestAnimationFrame for animations
**Rationale**: Optimal performance, smooth 60fps, hardware acceleration
**Alternatives considered**: JS-only animations (rejected - performance cost)

**Decision**: ARIA live regions and semantic HTML for accessibility
**Rationale**: Critical for children with different abilities, screen reader support
**Alternatives considered**: Visual-only interface (rejected - constitution violation)

**Output**: ✅ research.md complete - all technology decisions clarified

## Phase 1: Design & Contracts

_Prerequisites: research.md complete ✅_

**Data Model Entities** (detailed in data-model.md):

1. **PetState**: evolution form, happiness level, emotional state, accessories
2. **UserProgress**: WPM history, accuracy trends, total words typed, practice sessions
3. **StreakData**: consecutive days, forgiveness credits, last practice date
4. **ContentItem**: text snippet, source, difficulty level, theme category
5. **AchievementProgress**: unlocked accessories, milestones reached, celebrations triggered

**API Contracts** (local storage interfaces in /contracts/):

- Content management contracts (load daily content, filter by difficulty)
- Pet state management contracts (save/load state, evolution triggers)
- Progress tracking contracts (record session, calculate WPM trends)
- Achievement system contracts (check unlocks, trigger celebrations)

**Contract Tests Generated**:

- Content loading validation (schema compliance, age-appropriate filtering)
- Pet state persistence (save/restore accuracy, evolution state)
- Progress calculation (WPM accuracy, streak logic validation)
- Achievement triggering (milestone detection, unlock mechanics)

**Integration Test Scenarios** (from user stories):

- Child types and pet eats words correctly
- Error handling shows poop emojis and temporary pet sadness
- Daily practice leads to pet evolution and celebrations
- Parent dashboard displays progress without data transmission

**Agent Context Updated**: ✅ CLAUDE.md updated with current project context

**Output**: ✅ data-model.md, /contracts/\*, failing tests, quickstart.md, CLAUDE.md complete

## Phase 2: Task Planning Approach

_This section describes what the /tasks command will do - DO NOT execute during /plan_

**Task Generation Strategy**:

- Load `.specify/templates/tasks-template.md` as base
- Generate tasks from Phase 1 design docs (contracts, data model, quickstart)
- Content management tasks: content feed integration, filtering, storage
- Pet system tasks: state management, evolution logic, emotional animations
- Progress tracking tasks: WPM calculation, accuracy trending, streak management
- Achievement system tasks: milestone detection, unlocks, celebrations
- UI enhancement tasks: parent dashboard, accessibility improvements
- Integration tasks: component connections, end-to-end workflows

**Ordering Strategy**:

- TDD order: Contract tests, then implementation
- Dependency order: Core utilities → Data models → Components → Integration
- Mark [P] for parallel execution (independent components)
- Critical path: Content system → Pet state → Progress tracking → Achievements

**Estimated Output**: 35-40 numbered, ordered tasks covering all 28 functional requirements

**IMPORTANT**: This phase is executed by the /tasks command, NOT by /plan

## Phase 3+: Future Implementation

_These phases are beyond the scope of the /plan command_

**Phase 3**: Task execution (/tasks command creates tasks.md)
**Phase 4**: Implementation (execute tasks.md following constitutional principles)
**Phase 5**: Validation (run tests, execute quickstart.md, performance validation)

## Complexity Tracking

_No constitutional violations identified - this section remains empty_

## Progress Tracking

_This checklist is updated during execution flow_

**Phase Status**:

- [x] Phase 0: Research complete (/plan command)
- [x] Phase 1: Design complete (/plan command)
- [x] Phase 2: Task planning complete (/plan command - describe approach only)
- [ ] Phase 3: Tasks generated (/tasks command)
- [ ] Phase 4: Implementation complete
- [ ] Phase 5: Validation passed

**Gate Status**:

- [x] Initial Constitution Check: PASS
- [x] Post-Design Constitution Check: PASS
- [x] All NEEDS CLARIFICATION resolved
- [x] Complexity deviations documented (none needed)

---

_Based on Constitution v1.0.0 - See `.specify/memory/constitution.md`_
