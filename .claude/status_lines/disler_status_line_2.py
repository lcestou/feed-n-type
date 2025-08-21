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
    log_file = log_dir / 'status_line_v2.json'
    
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


def get_last_prompt_from_session(session_id):
    """Get the last prompt from the session file."""
    try:
        # Find the session file
        session_file = Path.home() / ".claude" / "projects" / f"{session_id}.jsonl"
        
        if not session_file.exists():
            return "No session file"
        
        # Read the last line that contains a user prompt
        last_prompt = "No prompts found"
        with open(session_file, 'r') as f:
            for line in f:
                try:
                    entry = json.loads(line.strip())
                    if entry.get('type') == 'user' and entry.get('content'):
                        content = entry['content']
                        if isinstance(content, list) and len(content) > 0:
                            # Get text from content array
                            text_parts = [item.get('text', '') for item in content if item.get('type') == 'text']
                            if text_parts:
                                last_prompt = ' '.join(text_parts)
                        elif isinstance(content, str):
                            last_prompt = content
                except json.JSONDecodeError:
                    continue
        
        return last_prompt[:50] + "..." if len(last_prompt) > 50 else last_prompt
    except Exception:
        return "Session read error"


def get_prompt_icon_and_color(prompt_text):
    """Determine icon and color based on prompt content."""
    prompt_lower = prompt_text.lower()
    
    # Coding related
    if any(word in prompt_lower for word in ['code', 'function', 'class', 'debug', 'fix', 'implement']):
        return "💻", "\033[32m"  # Green
    
    # File operations
    elif any(word in prompt_lower for word in ['file', 'read', 'write', 'create', 'delete']):
        return "📁", "\033[34m"  # Blue
    
    # Analysis/research
    elif any(word in prompt_lower for word in ['analyze', 'research', 'explain', 'understand', 'what']):
        return "🔍", "\033[33m"  # Yellow
    
    # Documentation
    elif any(word in prompt_lower for word in ['document', 'comment', 'readme', 'docs']):
        return "📝", "\033[36m"  # Cyan
    
    # Testing
    elif any(word in prompt_lower for word in ['test', 'spec', 'unit', 'integration']):
        return "🧪", "\033[35m"  # Magenta
    
    # Git operations
    elif any(word in prompt_lower for word in ['git', 'commit', 'push', 'pull', 'merge']):
        return "🔀", "\033[31m"  # Red
    
    # Default
    else:
        return "💬", "\033[37m"  # White


def main():
    try:
        # Read JSON input from stdin
        input_data = json.loads(sys.stdin.read())
        
        # Log the status line event
        log_status_line_event(input_data)
        
        # Extract fields
        model = input_data.get('model', {}).get('display_name', 'Unknown')
        session_id = input_data.get('session_id', '')
        
        # Get last prompt
        last_prompt = get_last_prompt_from_session(session_id)
        
        # Get icon and color for prompt
        icon, color = get_prompt_icon_and_color(last_prompt)
        reset_color = "\033[0m"
        
        # Build status line - Smart prompts with color coding
        status_line = f"[{model}] {icon} {color}{last_prompt}{reset_color}"
        
        print(status_line, end="")
        
    except json.JSONDecodeError:
        print("[Claude] 💬 No session data", end="")
    except Exception as e:
        print(f"[Error] {str(e)}", end="", file=sys.stderr)
        print("[Claude] 💬 Status error", end="")


if __name__ == '__main__':
    main()