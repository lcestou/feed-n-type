# Task Completion Checklist

## Code Quality Gates

When completing any development task, run these commands in order:

### 1. Type Checking

```bash
bun check
```

- Ensures TypeScript and Svelte types are correct
- Must pass before proceeding

### 2. Code Formatting

```bash
bun format
```

- Auto-formats code with Prettier
- Ensures consistent style

### 3. Linting

```bash
bun lint
```

- Runs Prettier check, Oxlint, and ESLint
- Fixes code quality issues

### 4. Build Verification

```bash
bun build
```

- Ensures code compiles for production
- Catches build-time errors

### 5. Testing (Optional but Recommended)

```bash
bun test:unit
bun test:e2e
```

## Additional Considerations

- Ensure all interactive elements have proper ARIA labels
- Test with keyboard navigation
- Verify responsive design on different screen sizes
- Check console for warnings or errors
- Validate accessibility with screen reader if possible

## Git Workflow

- Use descriptive commit messages
- Branch naming: `feat/`, `docs/`, `hotfix/` + description
- Run quality gates before committing
