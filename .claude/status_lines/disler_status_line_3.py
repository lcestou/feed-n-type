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
    log_file = log_dir / 'status_line_v3.json'
    
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


def get_recent_prompts_summary(session_id, max_prompts=3):
    """Get a summary of recent prompts from the session."""
    try:
        # Find the session file
        session_file = Path.home() / ".claude" / "projects" / f"{session_id}.jsonl"
        
        if not session_file.exists():
            return "No session"
        
        prompts = []
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
                                prompt_text = ' '.join(text_parts)
                                prompts.append(prompt_text)
                        elif isinstance(content, str):
                            prompts.append(content)
                except json.JSONDecodeError:
                    continue
        
        if not prompts:
            return "No prompts"
        
        # Get the last few prompts
        recent_prompts = prompts[-max_prompts:]
        
        # Truncate and add icons
        formatted_prompts = []
        for prompt in recent_prompts:
            # Add icon based on content
            icon = get_prompt_icon(prompt)
            truncated = prompt[:30] + "..." if len(prompt) > 30 else prompt
            formatted_prompts.append(f"{icon}{truncated}")
        
        return " → ".join(formatted_prompts)
    except Exception:
        return "Session error"


def get_prompt_icon(prompt_text):
    """Get an icon for the prompt based on its content."""
    prompt_lower = prompt_text.lower()
    
    if any(word in prompt_lower for word in ['code', 'function', 'class', 'debug']):
        return "💻"
    elif any(word in prompt_lower for word in ['file', 'read', 'write', 'create']):
        return "📁"
    elif any(word in prompt_lower for word in ['analyze', 'research', 'explain']):
        return "🔍"
    elif any(word in prompt_lower for word in ['test', 'spec', 'unit']):
        return "🧪"
    elif any(word in prompt_lower for word in ['git', 'commit', 'push']):
        return "🔀"
    elif any(word in prompt_lower for word in ['fix', 'bug', 'error']):
        return "🔧"
    else:
        return "💬"


def main():
    try:
        # Read JSON input from stdin
        input_data = json.loads(sys.stdin.read())
        
        # Log the status line event
        log_status_line_event(input_data)
        
        # Extract fields
        model = input_data.get('model', {}).get('display_name', 'Unknown')
        session_id = input_data.get('session_id', '')
        
        # Get agent name and recent prompts
        agent_name = get_agent_name()
        recent_prompts = get_recent_prompts_summary(session_id)
        
        # Build status line - Agent sessions with history
        status_line = f"[{agent_name}@{model}] {recent_prompts}"
        
        print(status_line, end="")
        
    except json.JSONDecodeError:
        print("[Claude@Unknown] 💬 No session data", end="")
    except Exception as e:
        print(f"[Error] {str(e)}", end="", file=sys.stderr)
        print("[Claude@Unknown] 💬 Status error", end="")


if __name__ == '__main__':
    main()