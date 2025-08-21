# Changelog

All notable changes to this project will be documented in this file.

The format is based on [Keep a Changelog](https://keepachangelog.com/en/1.0.0/),
and this project adheres to [Semantic Versioning](https://semver.org/spec/v2.0.0.html).

## [Unreleased]

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
