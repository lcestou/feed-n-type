#!/bin/sh
# Format and lint code files after edits

FILE_PATH="$1"

# Skip if no file path provided
if [ -z "$FILE_PATH" ]; then
    exit 0
fi

# Format with prettier for supported file types
case "$FILE_PATH" in
    *.ts|*.js|*.svelte|*.css|*.json|*.md)
        if command -v pnpm >/dev/null 2>&1; then
            pnpm exec prettier --write "$FILE_PATH" 2>/dev/null || true
        fi
        ;;
esac

# Lint with eslint for supported file types
case "$FILE_PATH" in
    *.ts|*.js|*.svelte)
        if command -v pnpm >/dev/null 2>&1; then
            pnpm exec eslint --fix "$FILE_PATH" 2>/dev/null || true
        fi
        ;;
esac