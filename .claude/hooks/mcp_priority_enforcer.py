#!/usr/bin/env -S uv run --script
# /// script
# requires-python = ">=3.8"
# ///

import sys
import json

# Tool mappings for MCP server priority (search and web operations only)
TOOL_REPLACEMENTS = {

    # Search Operations
    "Glob": "mcp__serena__find_file",
    "Grep": "mcp__serena__search_for_pattern",

    # Web Operations (non-serena)
    "WebSearch": "mcp__brave-search__brave_web_search",
    "WebFetch": "mcp__fetch__fetch"
}

# Tools that should never be blocked
ALWAYS_ALLOWED = {
    "Bash",        # System commands, git, pnpm
    "TodoWrite",   # Task tracking
    "Task",        # Agent delegation
    "BashOutput",  # Reading command output
    "KillShell",   # Managing background processes
    "Read",        # No serena equivalent available
    "Write",        # No serena equivalent available
    "Edit",        # Allow for JS/TS files where serena doesn't work
    "MultiEdit"    # Allow for JS/TS files where serena doesn't work
}

def main():
    """Check if tool usage violates MCP priority rules."""
    try:
        hook_data = json.loads(sys.stdin.read())
        tool_name = hook_data.get("tool_name", "")

        # Never block always-allowed tools
        if tool_name in ALWAYS_ALLOWED:
            return

        # Check if this tool should be replaced with MCP
        if tool_name in TOOL_REPLACEMENTS:
            replacement = TOOL_REPLACEMENTS[tool_name]
            print(f"MCP Priority: Use {replacement} instead of {tool_name}. No Bash workarounds!", file=sys.stderr)
            sys.exit(2)  # Block tool and send stderr to Claude

    except Exception:
        # Fail silently on any errors
        pass

if __name__ == "__main__":
    main()