#!/usr/bin/env -S uv run --script
# /// script
# requires-python = ">=3.8"
# dependencies = [
#     "python-dotenv",
# ]
# ///

import argparse
import json
import os
import sys
from pathlib import Path
from datetime import datetime

try:
    from dotenv import load_dotenv
    load_dotenv()
except ImportError:
    pass  # dotenv is optional


def log_user_prompt(session_id, input_data):
    """Log user prompt to logs directory."""
    # Ensure logs directory exists
    log_dir = Path("logs")
    log_dir.mkdir(parents=True, exist_ok=True)
    log_file = log_dir / 'user_prompt_submit.json'
    
    # Read existing log data or initialize empty list
    if log_file.exists():
        with open(log_file, 'r') as f:
            try:
                log_data = json.load(f)
            except (json.JSONDecodeError, ValueError):
                log_data = []
    else:
        log_data = []
    
    # Append the entire input data
    log_data.append(input_data)
    
    # Write back to file with formatting
    with open(log_file, 'w') as f:
        json.dump(log_data, f, indent=2)


def manage_session_data(session_id, prompt, name_agent=False):
    """Manage session data in the new JSON structure."""
    # Ensure sessions directory exists
    sessions_dir = Path(".claude/data/sessions")
    sessions_dir.mkdir(parents=True, exist_ok=True)
    
    # Load or create session file
    session_file = sessions_dir / f"{session_id}.json"
    
    if session_file.exists():
        try:
            with open(session_file, 'r') as f:
                session_data = json.load(f)
        except (json.JSONDecodeError, ValueError):
            session_data = {"session_id": session_id, "prompts": []}
    else:
        session_data = {"session_id": session_id, "prompts": []}
    
    # Add the new prompt
    session_data["prompts"].append(prompt)
    
    # Save the updated session data
    try:
        with open(session_file, 'w') as f:
            json.dump(session_data, f, indent=2)
    except Exception:
        # Silently fail if we can't write the file
        pass


def validate_prompt(prompt):
    """
    Validate the user prompt for security or policy violations.
    Returns tuple (is_valid, reason).
    """
    # Example validation rules (customize as needed)
    blocked_patterns = [
        # Add any patterns you want to block
        # Example: ('rm -rf /', 'Dangerous command detected'),
    ]
    
    prompt_lower = prompt.lower()
    
    for pattern, reason in blocked_patterns:
        if pattern.lower() in prompt_lower:
            return False, reason
    
    return True, None


def main():
    try:
        # Parse command line arguments
        parser = argparse.ArgumentParser()
        parser.add_argument('--validate', action='store_true', 
                          help='Enable prompt validation')
        parser.add_argument('--log-only', action='store_true',
                          help='Only log prompts, no validation or blocking')
        parser.add_argument('--store-last-prompt', action='store_true',
                          help='Store the last prompt for status line display')
        parser.add_argument('--name-agent', action='store_true',
                          help='Generate an agent name for the session')
        args = parser.parse_args()
        
        # Read JSON input from stdin
        input_data = json.loads(sys.stdin.read())
        
        # Extract relevant data
        session_id = input_data.get('sessionId', 'unknown')
        messages = input_data.get('messages', [])
        
        # Find the latest user message
        user_prompt = None
        for message in reversed(messages):
            if message.get('role') == 'user':
                user_prompt = message.get('content', '')
                break
        
        if not user_prompt:
            sys.exit(0)  # No user prompt to process
        
        # Log the prompt
        log_user_prompt(session_id, input_data)
        
        # Only proceed with further processing if not in log-only mode
        if not args.log_only:
            # Validate prompt if requested
            if args.validate:
                is_valid, reason = validate_prompt(user_prompt)
                if not is_valid:
                    print(f"BLOCKED: {reason}", file=sys.stderr)
                    sys.exit(2)  # Block the prompt
            
            # Store prompt data if requested
            if args.store_last_prompt:
                manage_session_data(session_id, user_prompt, args.name_agent)
        
        sys.exit(0)
        
    except json.JSONDecodeError:
        # Handle JSON decode errors gracefully
        sys.exit(0)
    except Exception:
        # Handle any other errors gracefully
        sys.exit(0)

if __name__ == '__main__':
    main()