# CLAUDE.md

This file provides guidance to Claude Code (claude.ai/code) when working with code in this repository.

## Project Overview

Feed & Type is a gamified typing learning tool built with SvelteKit (Svelte 5) and TypeScript. It makes typing practice engaging by using content from topics kids care about (Minecraft, Roblox, Pokemon, etc.) instead of boring phrases.

## Development Environment

This project uses Docker containers for development with automatic NAS mounting support.

### Starting Development

The project is containerized. To work on the project:

1. **Start the container**: `docker-compose up -d`
2. **Enter the container**: `docker exec -it feed-n-type-dev bash`
3. **Initialize SvelteKit project** (first time only):
   ```bash
   pnpm create svelte@latest . --template skeleton --typescript --prettier --eslint --vitest
   pnpm install
   ```
4. **Run development server**: `pnpm run dev --open` or simply type `dev` (custom alias)

**Note**: pnpm is pre-configured in the container to use `/home/claudeuser/pnpm-store` and allow build scripts. A local `.npmrc` file in the workspace ensures proper configuration.

### Common Commands

- **Development server**: `pnpm run dev` or `dev` (opens browser automatically)
- **Build**: `pnpm run build`
- **Preview**: `pnpm run preview`
- **Type checking**: `pnpm run check`
- **Linting**: `pnpm run lint`
- **Tests**: `pnpm run test` or `pnpm run test:unit`

### Tech Stack

- **Framework**: SvelteKit with Svelte 5
- **Language**: TypeScript
- **Package Manager**: pnpm
- **Linting**: oxlint (to be configured)
- **Container**: Node 22 on Debian Bookworm

### Port Configuration

Development server runs on port 5173 (exposed through Docker). Additional ports 5174-5178 are available for other services.

### Project Structure

Currently a skeleton project. Main development will happen in:
- `/src/routes/` - SvelteKit routes and pages
- `/src/lib/` - Shared components and utilities
- `/static/` - Static assets

## Architecture Notes

The application will:
1. Allow users to select content feeds (games, topics)
2. Fetch/display content from these feeds
3. Track typing progress and accuracy
4. Dynamically expand content as users complete sections
5. Gamify the experience with achievements and progress tracking