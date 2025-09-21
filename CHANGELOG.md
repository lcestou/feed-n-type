# Changelog

All notable changes to this project will be documented in this file.

The format is based on [Keep a Changelog](https://keepachangelog.com/en/1.0.0/),
and this project adheres to [Semantic Versioning](https://semver.org/spec/v2.0.0.html).

## [Unreleased]

#### 2025-09-21

**Added:**

- **Feature 001 comprehensive specification**: Generated complete specification package for gamified typing trainer including spec.md, plan.md, and 38 structured implementation tasks
- **Service architecture contracts**: Created 4 service contracts (Achievement, Content, PetState, ProgressTracking) defining clear API boundaries for Feature 001 implementation
- **Data model specification**: Established 5 core entities (PetState, UserProgress, StreakData, ContentItem, AchievementProgress) with IndexedDB + localStorage hybrid storage design
- **TDD task workflow**: Generated 38 tasks (T001-T038) with mandatory test-first approach, parallel execution guidelines, and existing component preservation rules
- **Future features roadmap**: Added comprehensive roadmap with 8 planned features for product evolution beyond MVP
- **Feed-n-Type constitution**: Established project governance document with MCP-driven development, child safety principles, and quality gates
- **Development workflow documentation**: Created quickstart.md and research.md for streamlined Feature 001 development process

**Changed:**

- **CLAUDE.md restructure**: Simplified project instructions with clearer MCP priority, critical rules, and workflow guidelines focused on Feature 001 implementation
- **Constitution framework**: Updated project constitution from template to Feed-n-Type specific governance with TypeScript strict mode, child safety, and quality requirements

#### 2025-09-20

**Added:**

- **Svelte documentation MCP server**: Added project-scoped Svelte 5 + SvelteKit documentation access via svelte-llm MCP server for enhanced development support
- **MCP priority enforcement**: Added intelligent hook system that encourages MCP server usage over default tools for better development workflow

**Changed:**

- **Claude Code automation workflow**: Replaced automated changelog hooks with manual review prompts to ensure accurate and contextual changelog entries
- **Hook system optimization**: Removed redundant changelog automation scripts in favor of agent-assisted documentation workflow
- **Development workflow**: Enhanced push commands to include manual changelog review step with Claude assistance
- **MCP tool guidance**: Softened enforcement language from "ALWAYS/NEVER" to recommendation-based guidance for better developer flexibility
- **Tool selection flexibility**: Updated MCP priority enforcer to allow Edit/MultiEdit tools alongside MCP alternatives for improved workflow adaptability
- **Documentation tone**: Improved developer experience by changing strict enforcement language to helpful guidance in project documentation
- **Serena configuration**: Updated project language configuration from Python to TypeScript for better language server support

#### 2025-09-06

**Added:**

- **GitHub Spec Kit integration**: Added uvx-based integration with GitHub's spec-kit repository for spec-driven development workflow
- **New commands**: Added `/specify`, `/plan`, `/tasks` commands for comprehensive specification-driven feature development
- **Memory system**: Added `memory/` directory with `constitution.md` and `constitution_update_checklist.md` for project governance
- **Automation scripts**: Added `scripts/` directory with workflow automation for feature development lifecycle
- **Development templates**: Added `templates/` directory with standardized spec, plan, and task templates

**Changed:**

- **Enhanced /plan command**: Modified existing `/plan` command to use Spec Kit's implementation planning approach for better structured development
- **Development workflow**: Improved feature development process with spec-first approach and automated task generation

#### 2025-09-03

**Added:**

- **Configuration updates**: Updated project configuration files

**Changed:**

- **Bug fixes in Typingotchi**

- **Bug fixes in +page**
- **Bug fixes in Typingotchi**

- **Documentation**: Updated project documentation

#### 2025-09-01

#### 2025-08-31

**Added:**

- **Component updates in VirtualKeyboard**
- **Component updates in +page**

- **Component updates in VirtualKeyboard**

**Changed:**

- **Documentation**: Updated project documentation

#### 2025-08-30

**Changed:**

- **Bug fixes in statusline**
- **Documentation**: Updated project documentation

#### 2025-08-26

**Added:**

- **Template structure updated in TypingArea component**
- **Template structure updated in +page component**
- **Template structure updated in VirtualKeyboard component**
- **Component updates in Typingotchi**

**Changed:**

- **Bug fixes in app.d**
- **Bug fixes in +page**

- **Documentation**: Updated project documentation
- **Bug fixes in +page**
- **Bug fixes in Typingotchi**
- **Updates in +page**

#### 2025-08-25

**Added:**

- **Template structure updated in +page component**
- **Added changelog_smart script**
- **Added changelog_dedup script**

**Changed:**

- **Bug fixes in +page**
- **Bug fixes in Typingotchi**
- **Enhanced +page component template**
- **Removed page.svelte.spec.ts**
- **Updated CHANGELOG documentation**

**Added:**

- **Added 1 new function(s) to vite.config**
- **Added imports for vitest/config in vite.config**
- **Added 2 new function(s) to post_tool_changelog**

#### 2025-08-24

**Added:**

- **Configuration updates**: Updated project configuration files

**Changed:**

- **Documentation**: Updated project documentation

#### 2025-08-23

**Added:**

- **Component updates in +page**
- **Slash command configuration**: Created `/dev` command that runs the `dev` alias in background for quick development server startup
- **Intelligent changelog reminder**: Implemented smart PostToolUse hook (`changelog_reminder.py`) that detects file changes and provides contextual reminders
- **Auto-update capability**: Changelog reminder can now automatically generate entries with `--auto-update` flag
- **Semantic IDs and ARIA labels**: Added comprehensive accessibility improvements to all typing components (VirtualKeyboard, Typingotchi, TypingArea)
- **PostToolUse changelog automation**: Created automated hook that updates changelog entries after significant file edits
- **Component updates in +page**: Enhanced script logic with error tracking and performance metrics

**Changed:**

- **Bug fixes in +page**
- **Project branding**: Updated main h1 title from "Feed & Type" to "Feed-n-Type" for consistent brand naming
- **Docker compose volumes**: Improved NAS mount configuration with better fallback handling and cross-platform compatibility
- **PostToolUse hook**: Replaced bash changelog reminder with Python version for better integration and functionality
- **Accessibility enhancements**: All interactive components now have proper semantic IDs, ARIA labels, and role attributes for screen reader support
- **UI styling**: Updated reset button color styling from blue to indigo for improved visual design
- **Configuration updates**: Updated project configuration files for improved changelog automation

#### 2025-01-22

**Added:**

- **Typingotchi component**: Interactive tamagotchi-like pet that reacts to typing performance with real-time animations and mood indicators
- **VirtualKeyboard component**: Authentic Mac-style virtual keyboard with proper QWERTY layout, Caps Lock key, and realistic styling

**Changed:**

- **Keyboard layout**: Updated virtual keyboard to neutral PC layout with standard Ctrl/Alt/Menu keys, removed arrow keys and Mac-specific symbols
- **Hook system**: Replaced automated changelog hooks with manual update instruction in CLAUDE.md for better reliability
- **Accessibility**: Added semantic IDs and ARIA labels to header navigation elements
- **Accessibility improvements**: Added semantic IDs for better interaction handling
- **Feed & Type branding**: Gamified typing learning tool with engaging content themes
- **Minimal header navigation**: Clean design with keyboard and sound toggle icons
- **Gaming-themed footer**: Brand-appropriate footer with gradient styling and gaming references
- **Split-screen typing interface**: TypingClub.com-style layout with text display and virtual keyboard
- **Interactive typing components**: Real-time character highlighting, accuracy tracking, and progress display
- **Virtual QWERTY keyboard**: Minimal keyboard layout with visual feedback for key presses
- **Navigation enhancements**: Updated header navigation with improved user interface
- **App identity**: Transformed from generic SvelteKit demo to Feed & Type typing tool
- **Navigation design**: Replaced demo navigation with minimal, icon-based header
- **Layout system**: Implemented full-width gray background with sticky footer positioning
- **Footer styling**: Updated to gaming theme with gradient background and appropriate branding
- **Typing interface**: Added split-screen layout with text display and virtual keyboard
- **UI enhancements**: Improved main page design and user interface components
- **SvelteKit demo content**: Removed About page, Sverdle game, and Counter component
- **Demo assets**: Cleaned up unused sample images and placeholder content
- **Generic branding**: Replaced placeholder content with Feed & Type specific messaging

## [0.1.0] - 2025-01-21

### Added

- **Enhanced Status Line System**: Comprehensive status line with real-time context window tracking, token estimation, session duration monitoring, and code productivity metrics
- **Professional Hook Collection**: Integrated Disler's comprehensive security hooks suite including pre_tool_use, post_tool_use, session_start, notification, stop, subagent_stop, user_prompt_submit, and pre_compact hooks
- **Status Line Variants**: Added 4 additional Disler status line configurations:
  - Basic git information display
  - Smart prompts with color-coded status indicators
  - Agent session tracking with command history
  - Extended metadata support for enhanced development insights
- **Text-to-Speech Notifications**: Multi-provider TTS system supporting ElevenLabs, OpenAI TTS, and pyttsx3 for audio feedback during development
- **Enhanced Session Management**: Improved logging, session tracking, and development workflow automation
- **Security Enhancement**: Comprehensive pre-tool validation replacing basic security checks
- **Development Productivity Tools**: Real-time metrics tracking for code changes, session duration, and development velocity
- **Multi-agent orchestrator system** with 12 specialized agents for focused development tasks
- **Comprehensive workflow rules** with critical reminders for development consistency
- **Agent-specific routing** for systems architecture, frontend, backend, QA, security, performance, and DevOps
- **Technical documentation writer agent** for automated changelog management
- **Regex escaping guidelines** and context-aware formatting rules
- **Critical git workflow rules** with mandatory quality gates (check → build → commit → push)
- **PR workflow documentation** with GitHub integration guidelines

### Changed

- **Layout improvements**: Updated site layout with sticky footer and full-width styling
- **UI enhancements**: Improved main page design and user interface
- **Hook Architecture**: Replaced redundant security-check.py with more comprehensive pre_tool_use.py security validation
- **Status Display**: Upgraded from basic status to rich, contextual information display with productivity metrics
- **Notification System**: Enhanced from simple alerts to multi-modal feedback including audio notifications
- **Session Tracking**: Improved from basic logging to comprehensive session analytics and development insights
- Restructured CLAUDE.md with multi-agent orchestrator content prioritized at top
- Updated changelog workflow to use technical-documentation-writer agent instead of shell script
- Enhanced git push workflow with agent-based changelog updates
- Improved agent handoff documentation with specific context requirements
- Refined automation rules distinguishing manual vs automatic processes

### Removed

- **Redundant Security Check**: Removed basic security-check.py in favor of comprehensive pre_tool_use.py hook
- Outdated hook implementations replaced by professional Disler collection

### Fixed

- Claude Code settings configuration and hook integration issues
- Hook script permissions and execution context problems

## [0.0.1] - 2025-01-21

### Added

- Initial SvelteKit project setup with Svelte 5
- Docker containerization for development environment
- Claude Code configuration with hooks and local settings
- Multi-agent orchestrator configuration
- Cloudflare Workers adapter configuration
- TypeScript and ESLint configuration
- Basic project structure and documentation

### Changed

- Configured pnpm to use local filesystem store for better performance
- Updated hook permissions to executable

### Removed

- Default Claude settings.json in favor of local configuration
