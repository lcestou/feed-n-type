#!/usr/bin/env -S uv run --script
# /// script
# requires-python = ">=3.11"
# dependencies = [
#     "python-dotenv",
# ]
# ///

import argparse
import json
import os
import sys
import subprocess
from pathlib import Path
from datetime import datetime

try:
    from dotenv import load_dotenv
    load_dotenv()
except ImportError:
    pass  # dotenv is optional


def log_status_line_event(input_data):
    """Log status line event to logs directory."""
    # Ensure logs directory exists
    log_dir = Path("logs")
    log_dir.mkdir(parents=True, exist_ok=True)
    log_file = log_dir / 'status_line.json'
    
    # Read existing log data or initialize empty list
    if log_file.exists():
        with open(log_file, 'r') as f:
            try:
                log_data = json.load(f)
            except (json.JSONDecodeError, ValueError):
                log_data = []
    else:
        log_data = []
    
    # Add timestamp to input data
    log_entry = {
        "timestamp": datetime.now().isoformat(),
        "data": input_data
    }
    
    # Append the log entry
    log_data.append(log_entry)
    
    # Write back to file with formatting
    with open(log_file, 'w') as f:
        json.dump(log_data, f, indent=2)


def get_git_info():
    """Get current git branch and status."""
    try:
        # Get current branch
        branch_result = subprocess.run(
            ['git', 'rev-parse', '--abbrev-ref', 'HEAD'],
            capture_output=True,
            text=True,
            timeout=5
        )
        current_branch = branch_result.stdout.strip() if branch_result.returncode == 0 else "unknown"
        
        # Get status
        status_result = subprocess.run(
            ['git', 'status', '--porcelain'],
            capture_output=True,
            text=True,
            timeout=5
        )
        
        if status_result.returncode == 0:
            status_lines = status_result.stdout.strip().split('\n') if status_result.stdout.strip() else []
            if status_lines:
                # Determine status symbol
                if any(line.startswith('??') for line in status_lines):
                    status_symbol = "🆕"  # Untracked files
                elif any(line.startswith(' M') for line in status_lines):
                    status_symbol = "📝"  # Modified files
                elif any(line.startswith('M ') for line in status_lines):
                    status_symbol = "📋"  # Staged files
                else:
                    status_symbol = "🔄"  # Other changes
            else:
                status_symbol = "✅"  # Clean
        else:
            status_symbol = "❓"  # Unknown
        
        return current_branch, status_symbol
    except Exception:
        return "unknown", "❓"


def get_workspace_info():
    """Get workspace information."""
    cwd = os.getcwd()
    return Path(cwd).name


def main():
    try:
        # Read JSON input from stdin
        input_data = json.loads(sys.stdin.read())
        
        # Log the status line event
        log_status_line_event(input_data)
        
        # Extract fields
        model = input_data.get('model', {}).get('display_name', 'Unknown')
        version = input_data.get('version', 'unknown')
        
        # Get Git and workspace info
        branch, git_status = get_git_info()
        workspace = get_workspace_info()
        
        # Build status line - Basic MVP with git info
        status_line = f"[{model}] 📁 {workspace} ({branch}) {git_status}"
        
        print(status_line, end="")
        
    except json.JSONDecodeError:
        print("[Claude] 📁 workspace (unknown) ❓", end="")
    except Exception as e:
        print(f"[Error] {str(e)}", end="", file=sys.stderr)
        print("[Claude] 📁 workspace (unknown) ❓", end="")


if __name__ == '__main__':
    main()