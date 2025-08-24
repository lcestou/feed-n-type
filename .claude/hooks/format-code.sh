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
            # Find project root and run prettier from there
            local project_root
            project_root=$(git rev-parse --show-toplevel 2>/dev/null || dirname "$FILE_PATH")
            
            # Convert to absolute path if relative
            local abs_path
            if [[ "$FILE_PATH" = /* ]]; then
                abs_path="$FILE_PATH"
            else
                abs_path="$(pwd)/$FILE_PATH"
            fi
            
            cd "$project_root" && pnpm exec prettier --write "$abs_path" 2>/dev/null || true
        fi
        ;;
esac

# Lint with eslint for supported file types
case "$FILE_PATH" in
    *.ts|*.js|*.svelte)
        if command -v pnpm >/dev/null 2>&1; then
            # Find project root and run eslint from there
            local project_root
            project_root=$(git rev-parse --show-toplevel 2>/dev/null || dirname "$FILE_PATH")
            
            # Convert to absolute path if relative
            local abs_path
            if [[ "$FILE_PATH" = /* ]]; then
                abs_path="$FILE_PATH"
            else
                abs_path="$(pwd)/$FILE_PATH"
            fi
            
            cd "$project_root" && pnpm exec eslint --fix "$abs_path" 2>/dev/null || true
        fi
        ;;
esac