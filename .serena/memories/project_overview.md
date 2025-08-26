# Feed-n-Type Project Overview

## Purpose

Feed-n-Type is a gamified typing learning application targeted at kid-friendly content. It features:

- Interactive typing practice with real-time feedback
- Virtual keyboard with visual feedback
- Typingotchi pet that responds to typing performance
- Typing statistics and progress tracking

## Tech Stack

- **Framework**: SvelteKit with Svelte 5 runes
- **Language**: TypeScript (strict mode)
- **Styling**: Tailwind CSS v4
- **Package Manager**: pnpm
- **Testing**: Vitest (unit tests), Playwright (E2E)
- **Deployment**: Cloudflare Pages (via Wrangler)
- **Linting**: ESLint + Oxlint, Prettier formatting

## Project Structure

```
src/
├── routes/
│   ├── +page.svelte (main typing interface)
│   ├── +page.ts
│   └── +layout.svelte
├── lib/
│   └── components/
│       ├── VirtualKeyboard.svelte
│       ├── TypingArea.svelte
│       └── Typingotchi.svelte
├── app.html
├── app.css
└── app.d.ts
```

## Key Components

1. **VirtualKeyboard**: PC keyboard layout with visual feedback
2. **TypingArea**: Text display with character-by-character progress tracking
3. **Typingotchi**: ASCII art pet that responds to typing performance
4. **Main Page**: Coordinates all components with typing state management
