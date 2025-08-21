#!/usr/bin/env -S uv run --script
# /// script
# requires-python = ">=3.8"
# ///

import json
import subprocess
import sys
from pathlib import Path

def has_significant_changes():
    """Check if there are significant code changes that warrant changelog update"""
    try:
        # Check for staged files
        result = subprocess.run(['git', 'diff', '--cached', '--name-only'], 
                              capture_output=True, text=True, cwd=Path.cwd())
        
        if result.returncode != 0:
            return False
            
        staged_files = result.stdout.strip().split('\n') if result.stdout.strip() else []
        
        # Check for unstaged files
        result = subprocess.run(['git', 'diff', '--name-only'], 
                              capture_output=True, text=True, cwd=Path.cwd())
        
        if result.returncode != 0:
            return False
            
        unstaged_files = result.stdout.strip().split('\n') if result.stdout.strip() else []
        
        # Combine all changed files
        all_files = set(staged_files + unstaged_files)
        all_files.discard('')  # Remove empty strings
        
        # Filter for significant files (exclude logs, temp files, etc.)
        significant_files = [f for f in all_files if not any(
            pattern in f for pattern in [
                'logs/', '.log', '.tmp', 'node_modules/', 
                '.claude/hooks/', 'CHANGELOG.md'
            ]
        )]
        
        return len(significant_files) > 0
        
    except Exception:
        return False

def update_changelog():
    """Trigger changelog update via technical-documentation-writer agent"""
    try:
        # Use claude command to trigger the agent
        cmd = [
            'claude', 'chat', '--agent', 'technical-documentation-writer',
            '--message', 'Update CHANGELOG.md with recent code changes. Analyze git diff and staged changes to create appropriate changelog entries.'
        ]
        
        result = subprocess.run(cmd, capture_output=True, text=True, cwd=Path.cwd())
        
        return result.returncode == 0
        
    except Exception:
        return False

def main():
    try:
        # Read JSON input from stdin
        input_data = json.load(sys.stdin)
        
        # Only update changelog if there are significant changes
        if has_significant_changes():
            # Run the changelog update
            update_changelog()
        
        sys.exit(0)
        
    except json.JSONDecodeError:
        # Handle JSON decode errors gracefully
        sys.exit(0)
    except Exception:
        # Exit cleanly on any other error
        sys.exit(0)

if __name__ == '__main__':
    main()