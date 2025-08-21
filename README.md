# Feed & Type

A gamified typing learning tool that makes typing practice engaging by using content kids actually care about!

## 🎮 Concept

Feed & Type transforms boring typing practice into an engaging experience by letting kids practice typing while reading about their favorite topics - Minecraft, Roblox, Yokai Watch, Pokemon, and more. 

Instead of typing random phrases like "The quick brown fox...", kids can:
- Read the latest news and updates about their favorite games
- Practice typing while staying informed about topics they love
- Progress through content that continuously expands as they type
- Build typing skills naturally while engaged with interesting content

## ✨ Features

- **Content Feeds**: Select from various topics/subjects that interest you
- **Preloaded Content**: Curated excerpts from books, blog posts, and news about popular games and topics
- **Dynamic Expansion**: Content keeps expanding as you complete sections
- **Gamified Learning**: Make typing practice fun and rewarding
- **Real-time Progress**: Track typing speed and accuracy as you go

## 🚀 Tech Stack

- **Framework**: SvelteKit with Svelte 5
- **Language**: TypeScript
- **Package Manager**: pnpm
- **Linting**: oxlint
- **Styling**: TBD
- **Database**: TBD

## 🎯 Target Audience

Designed for kids who want to improve their typing skills while reading about topics they're passionate about, including:
- Minecraft
- Roblox
- Yokai Watch
- Pokemon
- And more!

## 🛠️ Development

### Prerequisites

- Docker and Docker Compose
- pnpm (installed in container)

### Getting Started

1. **Clone the repository**:
```bash
git clone https://github.com/lcestou/feed-n-type.git
cd feed-n-type
```

2. **Start the development container**:
```bash
docker-compose up -d
```

3. **Enter the container**:
```bash
docker exec -it feed-n-type-dev bash
```

4. **Initialize the project** (first time only):
```bash
pnpm create svelte@latest . --template skeleton --typescript --prettier --eslint --vitest
pnpm install
```

5. **Run the development server**:
```bash
pnpm run dev --open
# or use the shortcut: dev
```

### Available Scripts

- `pnpm run dev` - Start development server
- `pnpm run build` - Build for production
- `pnpm run preview` - Preview production build
- `pnpm run check` - Run type checking
- `pnpm run lint` - Run linting
- `pnpm run test` - Run tests

## 📝 Future Ideas

- Achievement system and badges
- Typing speed competitions
- Custom feed support (RSS, APIs)
- Parent dashboard for progress tracking
- Difficulty levels based on typing skill
- Multiplayer typing races with friends

## 📄 License

TBD

---

*Making typing practice fun, one feed at a time!* 🎮⌨️