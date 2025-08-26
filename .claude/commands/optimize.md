---
description: Analyze and improve application performance, bundle size, and speed
allowed-tools: Task
---

Analyze and improve application performance with modern tooling

## Usage

- `/optimize [description]` - Analyze and optimize performance issues
- Uses **performance-optimizer** with **MCP servers priority**
- Leverages **mcp**serena**\*** for precise code analysis and optimization

## Tech Stack Optimization

- **SvelteKit 2**: Route-level code splitting, preloading strategies
- **Svelte 5 runes**: Fine-grained reactivity, minimal re-renders
- **Vite/Rolldown**: Modern bundling with tree-shaking
- **Tailwind v4**: CSS optimization and purging

## Examples

- `/optimize reduce bundle size for faster loading`
- `/optimize improve typing game rendering performance`
- `/optimize fix memory leaks during gameplay`
- `/optimize slow page load times`
- `/optimize animations causing frame drops`
- `/optimize large font loading delays`
- `/optimize inefficient component re-renders`

## What it does

**CRITICAL**: Agent must use TodoWrite tool to track optimization progress and keep user informed

1. **Performance Profiling**: Measures current performance metrics
2. **Bottleneck Identification**: Finds root causes of slowdowns
3. **Optimization Strategy**: Prioritizes high-impact improvements
4. **Implementation**: Applies performance fixes and enhancements
5. **Bundle Analysis**: Optimizes code splitting and tree shaking
6. **Testing**: Verifies improvements with real-world metrics
7. **Quality Gates**: Runs `pnpm format && pnpm lint && pnpm check && pnpm build` before completion

**Progress Tracking**: Agent updates todo with metrics improvements and optimization results

## Performance Targets

- **Bundle Size**: <500KB initial load
- **Load Time**: <3s Time to Interactive (3G network)
- **Frame Rate**: 60fps for animations and interactions
- **Memory**: Stable usage, no leaks during gameplay
- **API Response**: <500ms for game data operations

## Optimization Focus Areas

- **MCP Analysis**: Uses mcp**serena** for code structure analysis
- **Bundle**: SvelteKit code splitting, dynamic imports, tree-shaking
- **Svelte 5**: Runes optimization, component lifecycle efficiency
- **Tailwind v4**: CSS purging, utility optimization
- **Assets**: Font loading (@fontsource), image optimization
- **Network**: SvelteKit caching, API request batching
- **Gaming Performance**: Smooth typing feedback, real-time updates

## Best suited for

- Slow loading times or large bundle sizes
- Frame rate drops during animations or gameplay
- Memory leaks or growing memory usage
- Inefficient component rendering patterns
- Network request optimization needs
- Asset loading performance issues

**Tip**: Include specific performance symptoms you're experiencing - load times, memory usage, frame drops, etc.
