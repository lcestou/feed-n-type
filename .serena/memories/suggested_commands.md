# Suggested Commands for Feed-n-Type

## Development Commands

- `pnpm dev` - Start development server
- `pnpm build` - Build for production
- `pnpm preview` - Preview production build
- `pnpm check` - Run Svelte type checking
- `pnpm check:watch` - Run Svelte type checking in watch mode

## Code Quality

- `pnpm format` - Format code with Prettier
- `pnpm lint` - Run all linters (Prettier check + Oxlint + ESLint)
- `pnpm lint:oxlint` - Run Oxlint only
- `pnpm lint:eslint` - Run ESLint only

## Testing

- `pnpm test:unit` - Run unit tests with Vitest
- `pnpm test:e2e` - Run E2E tests with Playwright
- `pnpm test` - Run all tests (unit + E2E)

## Deployment

- `pnpm deploy` - Build and deploy to Cloudflare Pages
- `pnpm preview:cf` - Build and preview on Cloudflare Pages locally
- `pnpm cf:tail` - Tail Cloudflare Pages deployment logs

## System Commands (Darwin)

- `git` - Git version control
- `ls`, `cd` - Basic navigation
- `grep`, `find` - Search commands (prefer ripgrep/rg when available)
