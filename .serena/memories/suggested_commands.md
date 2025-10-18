# Suggested Commands for Feed-n-Type

## Development Commands

- `bun dev` - Start development server
- `bun build` - Build for production
- `bun preview` - Preview production build
- `bun check` - Run Svelte type checking
- `bun check:watch` - Run Svelte type checking in watch mode

## Code Quality

- `bun format` - Format code with Prettier
- `bun lint` - Run all linters (Prettier check + Oxlint + ESLint)
- `bun lint:oxlint` - Run Oxlint only
- `bun lint:eslint` - Run ESLint only

## Testing

- `bun test:unit` - Run unit tests with Vitest
- `bun test:e2e` - Run E2E tests with Playwright
- `bun test` - Run all tests (unit + E2E)

## Deployment

- `bun deploy` - Build and deploy to Cloudflare Pages
- `bun preview:cf` - Build and preview on Cloudflare Pages locally
- `bun cf:tail` - Tail Cloudflare Pages deployment logs

## System Commands (Darwin)

- `git` - Git version control
- `ls`, `cd` - Basic navigation
- `grep`, `find` - Search commands (prefer ripgrep/rg when available)
