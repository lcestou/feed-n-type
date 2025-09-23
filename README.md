# Feed-n-Type 🎮

A gamified typing trainer for kids aged 7-12 where children learn proper typing by feeding their virtual pet **Typingotchi** with words from their favorite gaming worlds.

## ✨ Features

- **Virtual Pet Companion**: Typingotchi evolves based on typing practice and accuracy
- **Gaming Content**: Pokemon, Nintendo, and Roblox-themed typing exercises
- **Child-Safe Design**: Zero personal data collection, all data stored locally
- **Positive Learning**: Mistakes become learning moments with gentle corrections
- **Parent Dashboard**: Progress tracking without compromising child privacy

## 🎯 Target Audience

- **Primary**: Children aged 7-12 learning to type
- **Secondary**: Parents monitoring typing progress
- **Design Philosophy**: Encouragement over competition, habits over speed

## 🛠️ Tech Stack

- **Frontend**: SvelteKit + Svelte 5 (with runes)
- **Language**: TypeScript (strict mode)
- **Styling**: Tailwind CSS v4
- **Storage**: IndexedDB + localStorage (local only)
- **Privacy**: Zero external data transmission

## 🚀 Quick Start

### Development

```sh
# Install dependencies
pnpm install

# Start development server
pnpm dev

# or open in browser automatically
pnpm dev --open
```

### Building

```sh
# Type checking
pnpm check

# Production build
pnpm build

# Preview production build
pnpm preview
```

## 🎮 Game Mechanics

### Typingotchi Pet System

- **Evolution**: Pet grows from Egg → Baby → Child → Teen → Adult
- **Feeding**: Correct typing feeds the pet with falling words
- **Emotions**: Pet reacts to typing accuracy and practice consistency
- **Health**: Heart system reflects typing habits and accuracy

### Learning Features

- **Progressive Difficulty**: Content adapts to child's skill level
- **Streak System**: Forgiving mechanics for missed practice days
- **Achievement System**: Celebrates milestones and improvements
- **Fire Mode**: Visual feedback for typing streaks and accuracy

## 🔒 Privacy & Safety

- **Local Storage Only**: No personal data leaves the device
- **Child-Safe Content**: Curated content from trusted gaming sources
- **No Social Features**: No chat, sharing, or user-generated content
- **Parent Transparency**: Clear progress visibility without data collection

## 📁 Project Structure

```
src/
├── routes/                 # SvelteKit pages
├── lib/
│   ├── components/        # Svelte components
│   ├── services/         # Business logic services
│   ├── models/           # Data models and types
│   ├── storage/          # Local storage utilities
│   └── utils/            # Helper functions
├── specs/                # Feature specifications
└── tests/                # Test suites
```

## 🏗️ Development Principles

1. **MCP-Driven**: Always consult Svelte 5 documentation via MCP server
2. **Type Safety**: Strict TypeScript with zero `any` types
3. **Quality Gates**: `pnpm check` → `pnpm build` → manual test
4. **Child-First**: Every decision prioritizes child safety and learning
5. **Local-Only**: No external APIs except content feeds

## 📊 Quality Standards

- **TypeScript**: Strict mode with comprehensive type coverage
- **Performance**: 60fps animations, <200KB bundle size
- **Accessibility**: WCAG AAA compliance, full keyboard navigation
- **Testing**: Component tests with semantic ID selectors
- **Documentation**: Comprehensive JSDoc for all public APIs

## 🎨 Design Language

- **Colors**: Bright, high-contrast palette (WCAG AAA)
- **Typography**: Inter font family, 18px+ base size
- **Spacing**: 8px grid system, 48px minimum touch targets
- **Animations**: CSS transforms, haptic-style micro-interactions
- **Sound**: Optional 8-bit effects with volume control

## 📈 Current Status

**Branch**: `001-build-a-gamified`
**Development Phase**: Core implementation complete
**Next Milestone**: Advanced features and content expansion

See [CHANGELOG.md](./CHANGELOG.md) for detailed development progress.

---

**Feed-n-Type** - Making typing practice as fun as playing games! 🚀
