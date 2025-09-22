# Tasks: Gamified Typing Trainer with Virtual Pet

**Input**: Design documents from `/specs/001-build-a-gamified/`
**Prerequisites**: plan.md ✅, research.md ✅, data-model.md ✅, contracts/ ✅

## Execution Flow (main)

```
1. Load plan.md from feature directory ✅
   → Tech stack: SvelteKit + Svelte 5 runes + TypeScript strict + Tailwind v4
   → Storage: IndexedDB + localStorage hybrid
   → Privacy: Local only, zero external data transmission
2. Load design documents ✅
   → data-model.md: 5 entities (PetState, UserProgress, StreakData, ContentItem, AchievementProgress)
   → contracts/: 4 services (Content, PetState, ProgressTracking, Achievement)
   → quickstart.md: 5 user story validation scenarios
3. Generate tasks by category ✅
   → Setup: Storage utilities, type definitions, service foundations
   → Tests: Contract tests [P], integration tests [P] (TDD approach)
   → Core: Data models [P], service implementations, component enhancements
   → Integration: Service connections, existing component preservation
   → Polish: Performance, accessibility, validation
4. Task rules applied ✅
   → Different files = [P] for parallel execution
   → Same file = sequential (preserve existing working components)
   → Tests before implementation (TDD mandatory)
5. Tasks numbered T001-T038 ✅
6. Dependencies documented ✅
7. Parallel execution examples provided ✅
```

## Format: `[ID] [P?] Description`

- **[P]**: Can run in parallel (different files, no dependencies)
- **🚨 PRESERVE**: Tasks that enhance rather than replace existing working components
- Exact file paths included for immediate execution

## Phase 3.1: Setup & Foundation ✅ COMPLETED

- [x] T001 Setup IndexedDB utilities and database schema in `src/lib/storage/db.ts`
- [x] T002 [P] Create TypeScript interfaces from data-model.md in `src/lib/types/index.ts`
- [x] T003 [P] Setup localStorage wrapper utilities in `src/lib/storage/local-storage.ts`
- [x] T004 Create static content structure in `static/content/` directory with gaming feeds

## Phase 3.2: Tests First (TDD) ✅ COMPLETED

**CRITICAL: These tests MUST be written and MUST FAIL before ANY implementation**

### Contract Tests (Services)

- [x] T005 [P] Contract test ContentService in `tests/contracts/content-service.test.ts`
- [x] T006 [P] Contract test PetStateService in `tests/contracts/pet-state-service.test.ts`
- [x] T007 [P] Contract test ProgressTrackingService in `tests/contracts/progress-tracking-service.test.ts`
- [x] T008 [P] Contract test AchievementService in `tests/contracts/achievement-service.test.ts`

### Integration Tests (User Stories)

- [x] T009 [P] Integration test: First-time user pet initialization in `tests/integration/first-time-user.test.ts`
- [x] T010 [P] Integration test: Error handling with pet reactions in `tests/integration/error-handling.test.ts`
- [x] T011 [P] Integration test: Daily practice and evolution flow in `tests/integration/evolution-flow.test.ts`
- [x] T012 [P] Integration test: Parent dashboard data access in `tests/integration/parent-dashboard.test.ts`
- [x] T013 [P] Integration test: Content variety and engagement in `tests/integration/content-engagement.test.ts`

## Phase 3.3: Core Implementation ✅ COMPLETED

### Data Models & Storage

- [x] T014 [P] PetState model with validation in `src/lib/models/PetState.ts`
- [x] T015 [P] UserProgress model with metrics calculation in `src/lib/models/UserProgress.ts`
- [x] T016 [P] StreakData model with forgiveness logic in `src/lib/models/StreakData.ts`
- [x] T017 [P] ContentItem model with filtering logic in `src/lib/models/ContentItem.ts`
- [x] T018 [P] AchievementProgress model with unlock logic in `src/lib/models/AchievementProgress.ts`

### Service Layer Implementation

- [x] T019 ContentService implementation in `src/lib/services/ContentService.ts`
- [x] T020 PetStateService implementation in `src/lib/services/PetStateService.ts`
- [x] T021 ProgressTrackingService implementation in `src/lib/services/ProgressTrackingService.ts`
- [x] T022 AchievementService implementation in `src/lib/services/AchievementService.ts`

### Component Enhancements (🚨 PRESERVE existing functionality)

- [x] T023 🚨 PRESERVE: Enhance TypingArea.svelte with progress tracking integration
- [x] T024 🚨 PRESERVE: Enhance VirtualKeyboard.svelte with challenging keys highlighting
- [x] T025 🚨 PRESERVE: Enhance Typingotchi.svelte with evolution animations and emotional states
- [x] T026 🚨 PRESERVE: Enhance main +page.svelte with achievement celebrations and streak tracking

## Phase 3.4: Integration & New Features

### Service Integration

- [x] T027 Connect ContentService to existing typing mechanics in enhanced components
- [x] T028 Integrate PetStateService with word feeding system in Typingotchi component
- [x] T029 Wire ProgressTrackingService to typing sessions and WPM calculations
- [x] T030 Connect AchievementService to milestone detection and celebration queue

### New Components

- [x] T031 [P] Create ParentDashboard component in `src/lib/components/ParentDashboard.svelte`
- [x] T032 [P] Create EvolutionCelebration component in `src/lib/components/EvolutionCelebration.svelte`
- [x] T033 [P] Create AchievementDisplay component in `src/lib/components/AchievementDisplay.svelte`
- [x] T034 Create Settings component with pet customization in `src/lib/components/Settings.svelte`

## Phase 3.5: Polish & Validation

- [ ] T035 [P] Performance optimization: Bundle size analysis and code splitting
- [ ] T036 [P] Accessibility improvements: ARIA labels and keyboard navigation enhancement
- [ ] T037 Data migration utilities for existing user progress in `src/lib/utils/migration.ts`
- [ ] T038 Execute quickstart.md validation scenarios and fix any integration issues

## Dependencies

**Setup Dependencies**:

- T001 (database) blocks T014-T018 (models)
- T002 (types) blocks T005-T008 (contract tests)

**TDD Dependencies**:

- Tests (T005-T013) MUST be written and failing before implementation (T014-T034)
- Contract tests (T005-T008) block service implementation (T019-T022)

**Implementation Dependencies**:

- Models (T014-T018) block services (T019-T022)
- Services (T019-T022) block integration (T027-T030)
- Component preservation (T023-T026) before new features (T031-T034)

**Integration Dependencies**:

- T027-T030 (service integration) before T035-T038 (polish)

## Parallel Execution Examples

### Phase 3.2: All Contract Tests Together

```bash
# Launch T005-T008 in parallel:
Task: "Contract test ContentService in tests/contracts/content-service.test.ts"
Task: "Contract test PetStateService in tests/contracts/pet-state-service.test.ts"
Task: "Contract test ProgressTrackingService in tests/contracts/progress-tracking-service.test.ts"
Task: "Contract test AchievementService in tests/contracts/achievement-service.test.ts"
```

### Phase 3.2: All Integration Tests Together

```bash
# Launch T009-T013 in parallel:
Task: "Integration test: First-time user pet initialization in tests/integration/first-time-user.test.ts"
Task: "Integration test: Error handling with pet reactions in tests/integration/error-handling.test.ts"
Task: "Integration test: Daily practice and evolution flow in tests/integration/evolution-flow.test.ts"
Task: "Integration test: Parent dashboard data access in tests/integration/parent-dashboard.test.ts"
Task: "Integration test: Content variety and engagement in tests/integration/content-engagement.test.ts"
```

### Phase 3.3: All Data Models Together

```bash
# Launch T014-T018 in parallel:
Task: "PetState model with validation in src/lib/models/PetState.ts"
Task: "UserProgress model with metrics calculation in src/lib/models/UserProgress.ts"
Task: "StreakData model with forgiveness logic in src/lib/models/StreakData.ts"
Task: "ContentItem model with filtering logic in src/lib/models/ContentItem.ts"
Task: "AchievementProgress model with unlock logic in src/lib/models/AchievementProgress.ts"
```

## Implementation Standards

**🚨 CRITICAL REQUIREMENTS**:

- ALWAYS use `mcp__svelte-llm__list_sections` → `get_documentation` before writing ANY Svelte 5 code
- ZERO 'any' types - strict TypeScript throughout
- Every task must pass: `pnpm check` → `pnpm build` → manual test
- Preserve ALL existing functionality while enhancing components

**Component Enhancement Guidelines**:

- Work WITH existing TypingArea, VirtualKeyboard, Typingotchi, and main page components
- Add new functionality through service integration rather than replacement
- Maintain existing visual design and user experience
- Test that existing features continue working after enhancements

**Service Architecture**:

- Interface-based design for future extensibility
- Local storage only (IndexedDB + localStorage)
- Error handling with graceful fallbacks
- Performance targets: <200KB bundle, 60fps animations, <100ms interactions

## Validation Checklist

**GATE: Verified before task execution**

- [x] All 4 contracts have corresponding test tasks (T005-T008)
- [x] All 5 entities have model tasks (T014-T018)
- [x] All tests come before implementation (T005-T013 before T014-T034)
- [x] Parallel tasks truly independent (different files, no shared dependencies)
- [x] Each task specifies exact file path for immediate execution
- [x] No task modifies same file as another [P] task
- [x] Existing component preservation explicitly marked with 🚨 PRESERVE
- [x] TDD workflow enforced (failing tests required before implementation)

## Success Criteria

**Feature Complete When**:

- All user story validation tests pass (T009-T013)
- Existing typing trainer functionality preserved and enhanced
- Pet evolution system working with celebrations
- Parent dashboard displaying progress metrics
- All constitutional requirements satisfied (MCP usage, quality gates)

**Ready for Production When**:

- `pnpm check` passes with zero errors
- `pnpm build` generates bundle <200KB
- quickstart.md scenarios execute successfully
- Cross-browser compatibility verified
- Performance targets met (60fps animations, <100ms interactions)
