#!/usr/bin/env python3
"""
PostToolUse hook that automatically updates CHANGELOG.md after significant file changes.
Runs silently and only updates when there are real changes to document.
"""

import subprocess
import sys
from pathlib import Path

def should_run_changelog_update(tool_name: str) -> bool:
    """Determine if changelog should be updated based on the tool used."""
    # Only run after tools that make significant changes
    significant_tools = {
        'Edit', 'MultiEdit', 'Write', 'NotebookEdit', 
        'mcp__serena__replace_symbol_body',
        'mcp__serena__insert_after_symbol',
        'mcp__serena__insert_before_symbol'
    }
    return tool_name in significant_tools

def main():
    if len(sys.argv) < 2:
        return
    
    tool_name = sys.argv[1]
    
    # Only run for significant file-changing tools
    if not should_run_changelog_update(tool_name):
        return
    
    # Run the smart changelog update silently
    try:
        script_path = Path(__file__).parent / "changelog_smart.py"
        result = subprocess.run([
            'python3', str(script_path), '--auto-update'
        ], capture_output=True, text=True, cwd=Path.cwd())
        
        # Only print output if there were actual updates (but suppress duplicate prevention messages)
        if result.stdout and "✅" in result.stdout and "duplicate" not in result.stdout.lower():
            print(result.stdout.strip(), file=sys.stderr)
        elif result.stderr and "duplicate" in result.stderr.lower():
            # Optionally log duplicate prevention (silent by default)
            pass
            
    except Exception:
        # Fail silently to avoid disrupting workflow
        pass

if __name__ == '__main__':
    main()