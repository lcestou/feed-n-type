#!/usr/bin/env python3
"""Security hook to block dangerous shell commands."""

import sys
import json

def main():
    try:
        # Read hook input from stdin
        data = json.loads(sys.stdin.read())
        
        # Get the command from tool input
        tool_input = data.get('tool_input', {})
        command = tool_input.get('command', '')
        
        # Define dangerous patterns
        dangerous_patterns = [
            'rm -rf',
            'sudo rm',
            'cat .env',
            'echo $',
            'git add .env',
            'git push --force',
            'git push -f',
            'chmod 777',
            'sudo',
            'dd if=',
            'npm publish',
            'curl | sh',
            'wget | sh',
            '> /dev/',
            'git reset --hard HEAD~',
            'git branch -D main',
            'git branch -D master'
        ]
        
        # Check for dangerous patterns
        for pattern in dangerous_patterns:
            if pattern in command:
                response = {
                    "action": "block",
                    "message": f"🚫 Blocked dangerous command: '{pattern}' detected.\nCommand: {command}\nPlease use a safer alternative."
                }
                print(json.dumps(response))
                sys.exit(1)
        
        # Allow safe commands
        response = {"action": "allow"}
        print(json.dumps(response))
        
    except Exception as e:
        # If hook fails, allow the command but log error
        response = {
            "action": "allow",
            "message": f"⚠️ Security hook error: {str(e)}"
        }
        print(json.dumps(response))

if __name__ == "__main__":
    main()