# Code Style and Conventions

## Code Formatting (Prettier)

- **Tabs**: Use tabs for indentation (not spaces)
- **Quotes**: Single quotes preferred
- **Trailing Commas**: None
- **Print Width**: 100 characters
- **Plugins**: prettier-plugin-svelte, prettier-plugin-tailwindcss

## TypeScript

- **Strict mode**: Enabled
- **ESLint**: Configured with typescript-eslint
- **No `any`**: Avoid using `any` type
- **Interface**: Use interfaces for component props

## Svelte 5 Patterns

- **Runes**: Use `$state`, `$derived`, `$effect` for reactive state
- **Props**: Use `let { prop }: Props = $props()` pattern
- **Component Structure**:
  1. Script with TypeScript
  2. HTML template
  3. Scoped styles

## Naming Conventions

- **Components**: PascalCase (e.g., `VirtualKeyboard.svelte`)
- **Files**: kebab-case for routes, PascalCase for components
- **Variables**: camelCase
- **Functions**: camelCase
- **Constants**: SCREAMING_SNAKE_CASE or camelCase for local

## Accessibility

- Use semantic HTML
- Include ARIA attributes where appropriate
- Provide proper labels and roles
- Consider keyboard navigation
