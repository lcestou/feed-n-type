---
description: Create and execute E2E tests with Playwright for user scenarios
allowed-tools: Task
argument-hint: '[scenario description]'
---

Create and execute comprehensive E2E tests using Playwright automation

**CRITICAL**: Agent must use TodoWrite tool to track testing progress and keep user informed

## Usage

- `/test` - Run existing Playwright test suite
- `/test typing game flow` - Create tests for specific user scenario
- `/test accessibility` - Test keyboard navigation and screen readers
- `/test mobile responsive` - Test touch interactions and mobile layout

## What it does

1. **Scenario Analysis**: Understands user workflows to test
2. **Test Planning**: Creates comprehensive test strategy
3. **Implementation**: Writes Playwright tests with real browser automation
4. **Execution**: Runs tests and captures failures/screenshots
5. **Reporting**: Provides detailed test results and recommendations
6. **Quality Gates**: Runs `pnpm format && pnpm lint && pnpm check && pnpm build` before completion

**Progress Tracking**: Agent updates todo showing test scenarios created and execution results

## Tech Stack Integration

- **MCP Priority**: Uses **mcp**playwright**\*** for browser automation
- **SvelteKit 2**: Tests routing, SSR, and page interactions
- **Svelte 5**: Tests component state and runes reactivity
- **Accessibility**: WCAG 2.1 AA compliance testing
- **Gaming UX**: Kid-friendly interaction patterns

## Test Scenarios

- **Core Gameplay**: Typing accuracy, scoring, progression
- **User Interface**: Navigation, modals, responsive design
- **Accessibility**: Keyboard navigation, screen reader support
- **Performance**: Loading times, smooth animations
- **Error Handling**: Network failures, invalid input

## Best suited for

- User acceptance testing before releases
- Regression testing after major changes
- Accessibility compliance validation
- Performance benchmarking
- Bug reproduction and verification

**Tip**: Describe user stories like "user starts game, types word, sees score increase"
