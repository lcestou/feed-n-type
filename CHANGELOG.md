# Changelog

All notable changes to this project will be documented in this file.

The format is based on [Keep a Changelog](https://keepachangelog.com/en/1.0.0/),
and this project adheres to [Semantic Versioning](https://semver.org/spec/v2.0.0.html).

## [Unreleased]

### Added

- Multi-agent orchestrator system with 12 specialized agents for focused development tasks
- Comprehensive workflow rules with critical reminders for development consistency
- Agent-specific routing for systems architecture, frontend, backend, QA, security, performance, and DevOps
- Technical documentation writer agent for automated changelog management
- Enhanced Claude Code local settings with comprehensive hook system
- Update changelog agent hook script for automated documentation updates
- Regex escaping guidelines and context-aware formatting rules
- Critical git workflow rules with mandatory quality gates (check → build → commit → push)
- PR workflow documentation with GitHub integration guidelines

### Changed

- Restructured CLAUDE.md with multi-agent orchestrator content prioritized at top
- Updated changelog workflow to use technical-documentation-writer agent instead of shell script
- Enhanced git push workflow with agent-based changelog updates
- Improved agent handoff documentation with specific context requirements
- Refined automation rules distinguishing manual vs automatic processes

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
