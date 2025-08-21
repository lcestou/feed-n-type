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
    log_file = log_dir / 'status_line_v4.json'
    
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


def get_agent_name():
    """Get the current agent name from logs or environment."""
    try:
        # Check for agent name in logs
        log_file = Path("logs") / "agent_sessions.json"
        if log_file.exists():
            with open(log_file, 'r') as f:
                try:
                    agent_data = json.load(f)
                    if isinstance(agent_data, list) and agent_data:
                        # Get the last agent session
                        last_session = agent_data[-1]
                        return last_session.get('agent_name', 'Claude')
                except (json.JSONDecodeError, ValueError):
                    pass
        
        # Fallback to environment variable
        return os.getenv('CLAUDE_AGENT_NAME', 'Claude')
    except Exception:
        return 'Claude'


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
        
        return last_prompt
    except Exception:
        return "Session read error"


def truncate_prompt(prompt, max_length=40):
    """Truncate prompt to specified length."""
    if len(prompt) <= max_length:
        return prompt
    return prompt[:max_length-3] + "..."


def get_prompt_icon(prompt_text):
    """Get an icon for the prompt based on its content."""
    prompt_lower = prompt_text.lower()
    
    if any(word in prompt_lower for word in ['code', 'function', 'class', 'debug', 'implement']):
        return "💻"
    elif any(word in prompt_lower for word in ['file', 'read', 'write', 'create', 'delete']):
        return "📁"
    elif any(word in prompt_lower for word in ['analyze', 'research', 'explain', 'understand']):
        return "🔍"
    elif any(word in prompt_lower for word in ['document', 'comment', 'readme', 'docs']):
        return "📝"
    elif any(word in prompt_lower for word in ['test', 'spec', 'unit', 'integration']):
        return "🧪"
    elif any(word in prompt_lower for word in ['git', 'commit', 'push', 'pull', 'merge']):
        return "🔀"
    elif any(word in prompt_lower for word in ['fix', 'bug', 'error', 'issue']):
        return "🔧"
    elif any(word in prompt_lower for word in ['deploy', 'build', 'release']):
        return "🚀"
    elif any(word in prompt_lower for word in ['security', 'auth', 'password']):
        return "🔒"
    elif any(word in prompt_lower for word in ['performance', 'optimize', 'speed']):
        return "⚡"
    else:
        return "💬"


def get_session_extras(input_data):
    """Extract additional metadata from session data."""
    extras = []
    
    # Add cost information if available
    cost_info = input_data.get('cost', {})
    if cost_info:
        total_cost = cost_info.get('total_cost_usd', 0)
        if total_cost > 0:
            extras.append(f"💰${total_cost:.2f}")
    
    # Add duration if available
    duration_ms = cost_info.get('total_duration_ms', 0)
    if duration_ms > 0:
        if duration_ms < 60000:
            duration_str = f"{duration_ms // 1000}s"
        else:
            minutes = duration_ms // 60000
            seconds = (duration_ms % 60000) // 1000
            duration_str = f"{minutes}m{seconds}s"
        extras.append(f"⏱️{duration_str}")
    
    # Add lines changed if available
    lines_added = cost_info.get('total_lines_added', 0)
    lines_removed = cost_info.get('total_lines_removed', 0)
    if lines_added > 0 or lines_removed > 0:
        extras.append(f"📊+{lines_added}/-{lines_removed}")
    
    return extras


def main():
    try:
        # Read JSON input from stdin
        input_data = json.loads(sys.stdin.read())
        
        # Log the status line event
        log_status_line_event(input_data)
        
        # Extract fields
        model = input_data.get('model', {}).get('display_name', 'Unknown')
        session_id = input_data.get('session_id', '')
        
        # Get agent name and last prompt
        agent_name = get_agent_name()
        last_prompt = get_last_prompt_from_session(session_id)
        
        # Format prompt with icon and truncation
        prompt_icon = get_prompt_icon(last_prompt)
        truncated_prompt = truncate_prompt(last_prompt)
        
        # Get session extras
        extras = get_session_extras(input_data)
        extras_str = " │ " + " ".join(extras) if extras else ""
        
        # Colors
        agent_color = "\033[32m"  # Green
        model_color = "\033[34m"  # Blue
        prompt_color = "\033[33m"  # Yellow
        extras_color = "\033[36m"  # Cyan
        reset_color = "\033[0m"
        
        # Build status line - Extended metadata support
        status_line = f"[{agent_color}{agent_name}{reset_color}@{model_color}{model}{reset_color}] {prompt_icon} {prompt_color}{truncated_prompt}{reset_color}{extras_color}{extras_str}{reset_color}"
        
        print(status_line, end="")
        
    except json.JSONDecodeError:
        print("[Claude@Unknown] 💬 No session data", end="")
    except Exception as e:
        print(f"[Error] {str(e)}", end="", file=sys.stderr)
        print("[Claude@Unknown] 💬 Status error", end="")


if __name__ == '__main__':
    main()