#!/usr/bin/env python3
"""Claude Code status line with context visualization."""

import sys
import json
import subprocess
import os
from pathlib import Path


def get_git_branch():
    """Get current git branch if in a git repository."""
    try:
        # Check if we're in a git repo
        subprocess.run(
            ["git", "rev-parse", "--git-dir"], 
            check=True, 
            capture_output=True, 
            cwd="."
        )
        
        # Get current branch
        result = subprocess.run(
            ["git", "branch", "--show-current"],
            capture_output=True,
            text=True,
            cwd="."
        )
        
        if result.returncode == 0 and result.stdout.strip():
            return f" ({result.stdout.strip()})"
        
    except (subprocess.CalledProcessError, FileNotFoundError):
        pass
    
    return ""


def get_project_name():
    """Get project name from package.json or fallback to 'feed-n-type'."""
    package_json_path = Path("package.json")
    
    if package_json_path.exists():
        try:
            with open(package_json_path) as f:
                package_data = json.load(f)
                name = package_data.get("name")
                if name:
                    return name
        except (json.JSONDecodeError, FileNotFoundError):
            pass
    
    return "feed-n-type"


def create_context_bar(percent, bar_length=10):
    """Create a visual context usage bar."""
    filled = int(percent * bar_length / 100)
    empty = bar_length - filled
    
    bar = "█" * filled + "░" * empty
    return bar


def estimate_context_usage(transcript_path):
    """Estimate context usage from transcript file size."""
    try:
        if not Path(transcript_path).exists():
            return 0, 0
        
        # Get file size in characters
        file_size = Path(transcript_path).stat().st_size
        
        # Rough estimation: 1 token ≈ 4 characters
        estimated_tokens = file_size // 4
        
        # Claude Code typically compacts at ~80% of 200k tokens (160k)
        max_tokens = 160000
        percentage = min(100, (estimated_tokens * 100) // max_tokens)
        
        return estimated_tokens, percentage
    except Exception:
        return 0, 0


def format_duration(duration_ms):
    """Format duration in milliseconds to human readable."""
    if duration_ms < 1000:
        return f"{duration_ms}ms"
    elif duration_ms < 60000:
        return f"{duration_ms // 1000}s"
    else:
        minutes = duration_ms // 60000
        seconds = (duration_ms % 60000) // 1000
        return f"{minutes}m{seconds}s"


def format_tokens(tokens):
    """Format token count to readable format."""
    if tokens < 1000:
        return f"{tokens}"
    elif tokens < 1000000:
        return f"{tokens // 1000}K"
    else:
        return f"{tokens // 1000000}M"


def main():
    """Generate Claude Code status line."""
    try:
        # Read JSON input from Claude Code
        input_data = json.load(sys.stdin)
        
        # Extract data from JSON
        model = input_data.get("model", {}).get("display_name", "Unknown")
        transcript_path = input_data.get("transcript_path", "")
        
        # Get project info
        project_name = get_project_name()
        git_branch = get_git_branch()
        
        # Get context usage estimation
        tokens, context_percent = estimate_context_usage(transcript_path)
        context_bar = create_context_bar(context_percent)
        
        # Get additional metrics
        cost_info = input_data.get("cost", {})
        total_duration = cost_info.get("total_duration_ms", 0)
        lines_added = cost_info.get("total_lines_added", 0)
        lines_removed = cost_info.get("total_lines_removed", 0)
        
        # Format metrics
        duration_str = format_duration(total_duration)
        tokens_str = format_tokens(tokens)
        
        # Build status line with context tracking
        status_line = f"[{model}] 📁 {project_name}{git_branch} │ C: [{context_bar}] {context_percent}% ({tokens_str}) │ ⏱️ {duration_str} │ +{lines_added}/-{lines_removed}"
        print(status_line, end="")
        
    except Exception as e:
        # Fallback status line if something goes wrong
        print(f"[Error] Status line failed: {str(e)}", end="", file=sys.stderr)
        print("[Claude] 📁 feed-n-type │ C: [░░░░░░░░░░] 0%", end="")


if __name__ == "__main__":
    main()