# Development Tools Documentation

## GitHub Spec Kit

### Overview

GitHub Spec Kit is a Spec-Driven Development toolkit that enables building high-quality software by making specifications executable rather than just documentation. It focuses on defining **what** to build and **why**, letting AI assistants handle the implementation details.

### Installation

The project uses the official GitHub Spec Kit CLI tool installed via `uvx`:

```bash
# Check if tools are available
uvx --from git+https://github.com/github/spec-kit.git specify check

# Initialize in a new project
uvx --from git+https://github.com/github/spec-kit.git specify init <PROJECT_NAME> --ai claude

# Initialize in existing project
uvx --from git+https://github.com/github/spec-kit.git specify init --ai claude --here --no-git
```

### Directory Structure

```
.specify/
├── memory/           # Project constitution and governance
│   └── constitution.md
├── scripts/          # Automation scripts for workflow
│   └── bash/
├── templates/        # Spec, plan, and task templates
│   ├── spec-template.md
│   ├── plan-template.md
│   └── tasks-template.md
└── ...

.claude/commands/     # Claude-specific command definitions
├── constitution.md   # /constitution command
├── specify.md        # /specify command
├── plan.md          # /plan command
├── tasks.md         # /tasks command
└── implement.md     # /implement command
```

### Workflow Commands

#### 1. `/constitution` - Establish Project Principles

Creates or updates the project constitution with governing principles and development guidelines.

**Usage:**

```
/constitution Create principles focused on code quality, testing standards, user experience consistency, and performance requirements
```

**Output:** `.specify/memory/constitution.md`

#### 2. `/specify` - Create Feature Specifications

First step in the development lifecycle. Creates a detailed specification from natural language description.

**Usage:**

```
/specify Build a user dashboard that shows activity metrics with filtering by date range
```

**Actions:**

- Creates feature branch (`feat/001-<feature-name>`)
- Generates spec file in `specs/` directory
- Uses `.specify/templates/spec-template.md`

#### 3. `/plan` - Create Implementation Plan

Second step. Defines technical implementation details, architecture, and design decisions.

**Usage:**

```
/plan Use SvelteKit with TypeScript, Tailwind CSS for styling, and local storage for persistence
```

**Generates:**

- `plan.md` - Technical implementation details
- `data-model.md` - Entity definitions (if applicable)
- `contracts/` - API specifications (if applicable)
- `research.md` - Technical decisions
- `quickstart.md` - Test scenarios

#### 4. `/tasks` - Generate Actionable Tasks

Third step. Breaks down the plan into specific, executable tasks.

**Usage:**

```
/tasks
```

**Creates:** Numbered task list (T001, T002, etc.) with:

- Setup tasks
- Test tasks (marked [P] for parallel execution)
- Core implementation tasks
- Integration tasks
- Polish tasks

#### 5. `/implement` - Execute Implementation

Fourth step. Executes all tasks according to the plan.

**Usage:**

```
/implement
```

### Updating Spec Kit

To get the latest version:

```bash
# Check for updates
uvx --from git+https://github.com/github/spec-kit.git specify check

# The tool auto-updates when run via uvx
```

### Version Information

- **Current Version:** v0.0.45 (as of 2025-09-20)
- **Installation Method:** uvx from GitHub repository
- **AI Support:** Claude, Gemini, Copilot, Cursor, Qwen, OpenCode, Windsurf

### Migration Notes

#### From Custom Implementation

If migrating from a custom Spec Kit implementation:

1. **Backup existing files:**

   ```bash
   mkdir -p .backup-custom-spec-kit
   cp -r scripts templates memory .backup-custom-spec-kit/
   ```

2. **Remove custom implementation:**
   - Delete `scripts/`, `templates/`, `memory/` directories
   - Remove custom command files from `.claude/commands/`

3. **Install official Spec Kit:**
   ```bash
   echo "y" | uvx --from git+https://github.com/github/spec-kit.git specify init --ai claude --here --no-git
   ```

### Best Practices

1. **Start with Constitution:** Always define project principles first
2. **Spec Before Code:** Create specifications before implementation
3. **Follow the Flow:** specify → plan → tasks → implement
4. **Version Control:** Each feature gets its own branch
5. **Test-First:** Tasks include test creation before implementation

### Troubleshooting

**Issue:** Command not recognized
**Solution:** Ensure `.claude/commands/` contains the command files

**Issue:** Scripts not executable
**Solution:** Run `chmod +x .specify/scripts/bash/*.sh`

**Issue:** Template not found
**Solution:** Check `.specify/templates/` directory exists

### Additional Resources

- [GitHub Spec Kit Repository](https://github.com/github/spec-kit)
- [Spec-Driven Development Guide](https://github.com/github/spec-kit/blob/main/spec-driven.md)
- [Video Overview](https://www.youtube.com/watch?v=a9eR1xsfvHg)

### Integration with Project Workflow

Spec Kit commands integrate with the existing project workflow:

- Use after `/dev` to plan new features
- Compatible with `/push` and `/merge` commands
- Works alongside `bun` build system
- Follows project branch naming conventions (`feat/`, `docs/`, `hotfix/`)

---

_Last Updated: 2025-09-20_
_Spec Kit Version: v0.0.45_
