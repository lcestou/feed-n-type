---
description: Backend API development with server-side logic and data operations
allowed-tools: Task
argument-hint: '[endpoint or feature description]'
---

Design and implement backend APIs, server logic, and data operations

**CRITICAL**: Agent must use TodoWrite tool to track API development progress and keep user informed

## Usage

- `/api user scores` - Create endpoints for score tracking and leaderboards
- `/api auth system` - Implement user authentication and session management
- `/api game stats` - Build analytics and progress tracking APIs
- `/api data export` - Create data export and backup functionality

## What it does

1. **API Design**: Plans RESTful endpoints and data schemas
2. **Implementation**: Builds server routes with SvelteKit server functions
3. **Database Integration**: Sets up data persistence and queries
4. **Validation**: Implements input validation and error handling
5. **Testing**: Creates API tests and documentation
6. **Quality Gates**: Runs `pnpm format && pnpm lint && pnpm check && pnpm build` before completion

**Progress Tracking**: Agent updates todo showing endpoints created and integration status

## Tech Stack Integration

- **MCP Priority**: Uses **mcp**serena**\*** for precise code operations
- **SvelteKit 2**: Server-side routes, load functions, form actions
- **TypeScript**: Strict API contracts and type safety
- **Gaming Context**: Score tracking, user progress, leaderboards
- **Security**: Input validation, authentication, data protection

## API Development Areas

- **User Management**: Registration, authentication, profiles
- **Game Data**: Scores, progress tracking, statistics
- **Content Management**: Word lists, difficulty settings, themes
- **Analytics**: Usage metrics, performance data, insights
- **Integration**: External APIs, third-party services
- **Real-time**: WebSocket connections, live updates

## Implementation Standards

- **RESTful Design**: Proper HTTP methods and status codes
- **Type Safety**: Full TypeScript coverage for requests/responses
- **Error Handling**: Comprehensive error responses and logging
- **Validation**: Input sanitization and schema validation
- **Documentation**: API documentation and usage examples
- **Testing**: Unit tests for business logic, integration tests for endpoints

## Best suited for

- Adding server-side functionality to frontend features
- User data persistence and management
- Third-party service integrations
- Real-time game features and multiplayer
- Analytics and reporting capabilities
- Content management and administration

**Tip**: Describe the data flow like "users submit scores, system validates and saves to database, returns updated leaderboard"
