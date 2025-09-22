#!/usr/bin/env -S uv run --script
# /// script
# requires-python = ">=3.8"
# ///

import json
import sys
import re
import random
from pathlib import Path

# Svelte MCP messages for Read operations (proactive guidance)
SVELTE_READ_MESSAGES = [
    "📖 READING src/ file - Planning to edit? Check mcp__svelte-llm FIRST for Svelte 5 patterns!",
    "⚡ BEFORE YOU EDIT: Svelte 5 changed everything. Verify with mcp__svelte-llm NOW!",
    "🎯 Reading to edit? STOP! Check mcp__svelte-llm for current Svelte 5 syntax first!",
    "⏸️ PAUSE: If you're about to edit, refresh on Svelte 5 with mcp__svelte-llm first!",
    "🔄 Reading src/? The patterns you remember are OUTDATED. Check mcp__svelte-llm before editing!",
    "💡 PRO TIP: Reading? Use mcp__svelte-llm NOW to avoid Svelte 5 mistakes later!",
]

# Svelte MCP messages for Edit/Write operations (urgent correction)
SVELTE_EDIT_MESSAGES = [
    "⚠️ EDITING without checking docs? Dangerous! Use mcp__svelte-llm for Svelte 5 patterns!",
    "🚨 Wait - did you check mcp__svelte-llm? Svelte 5 syntax is completely different!",
    "❌ STOP: Editing src/ without mcp__svelte-llm is risky. Verify Svelte 5 patterns NOW!",
    "🔥 URGENT: $state not stores! Check mcp__svelte-llm before you break something!",
    "⏰ Last chance: Use mcp__svelte-llm to verify Svelte 5 syntax before this edit!",
    "📛 WARNING: Old Svelte patterns will break. Check mcp__svelte-llm immediately!",
]

def is_dangerous_rm_command(command):
    """
    Comprehensive detection of dangerous rm commands.
    Matches various forms of rm -rf and similar destructive patterns.
    """
    # Normalize command by removing extra spaces and converting to lowercase
    normalized = ' '.join(command.lower().split())
    
    # Pattern 1: Standard rm -rf variations
    patterns = [
        r'\brm\s+.*-[a-z]*r[a-z]*f',  # rm -rf, rm -fr, rm -Rf, etc.
        r'\brm\s+.*-[a-z]*f[a-z]*r',  # rm -fr variations
        r'\brm\s+--recursive\s+--force',  # rm --recursive --force
        r'\brm\s+--force\s+--recursive',  # rm --force --recursive
        r'\brm\s+-r\s+.*-f',  # rm -r ... -f
        r'\brm\s+-f\s+.*-r',  # rm -f ... -r
    ]
    
    # Check for dangerous patterns
    for pattern in patterns:
        if re.search(pattern, normalized):
            return True
    
    # Pattern 2: Check for rm with recursive flag targeting dangerous paths
    dangerous_paths = [
        r'/',           # Root directory
        r'/\*',         # Root with wildcard
        r'~',           # Home directory
        r'~/',          # Home directory path
        r'\$HOME',      # Home environment variable
        r'\.\.',        # Parent directory references
        r'\*',          # Wildcards in general rm -rf context
        r'\.',          # Current directory
        r'\.\s*$',      # Current directory at end of command
    ]
    
    if re.search(r'\brm\s+.*-[a-z]*r', normalized):  # If rm has recursive flag
        for path in dangerous_paths:
            if re.search(path, normalized):
                return True
    
    return False

def is_dangerous_git_command(command):
	"""
	Comprehensive detection of dangerous git commands that could cause data loss.
	Detects commands that can permanently delete commits, branches, or files.
	"""
	# Normalize command by removing extra spaces and converting to lowercase
	normalized = ' '.join(command.lower().split())
	
	# Pattern 1: Hard reset commands that lose commits
	reset_patterns = [
		r'\bgit\s+reset\s+--hard\s+head~\d+',  # git reset --hard HEAD~X
		r'\bgit\s+reset\s+--hard\s+[a-f0-9]{7,40}',  # git reset --hard <commit>
		r'\bgit\s+reset\s+--hard\s+origin/',  # git reset --hard origin/branch
	]
	
	# Pattern 2: Branch deletion commands
	branch_deletion_patterns = [
		r'\bgit\s+branch\s+-d\s+',  # git branch -D (force delete)
		r'\bgit\s+branch\s+--delete\s+--force',  # git branch --delete --force
		r'\bgit\s+update-ref\s+-d\s+refs/heads/',  # git update-ref -d refs/heads/
	]
	
	# Pattern 3: Remote manipulation
	remote_patterns = [
		r'\bgit\s+remote\s+remove\s+',  # git remote remove
		r'\bgit\s+remote\s+rm\s+',  # git remote rm
	]
	
	# Pattern 4: Aggressive cleanup commands
	cleanup_patterns = [
		r'\bgit\s+clean\s+.*-[a-z]*f[a-z]*d',  # git clean -fd, -fdx
		r'\bgit\s+clean\s+.*-[a-z]*d[a-z]*f',  # git clean -df, -dfx
		r'\bgit\s+clean\s+.*-[a-z]*x',  # git clean with -x flag
		r'\bgit\s+gc\s+--aggressive\s+--prune=now',  # aggressive garbage collection
		r'\bgit\s+reflog\s+expire\s+--expire=now',  # expire reflog immediately
	]
	
	# Pattern 5: History rewriting commands
	history_patterns = [
		r'\bgit\s+filter-branch',  # git filter-branch
		r'\bgit\s+checkout\s+--orphan',  # git checkout --orphan
	]
	
	# Combine all patterns
	all_patterns = (reset_patterns + branch_deletion_patterns + 
					remote_patterns + cleanup_patterns + history_patterns)
	
	# Check for dangerous patterns
	for pattern in all_patterns:
		if re.search(pattern, normalized):
			return True
	
	# Special case: Check for deletion of main/master branches
	main_branch_patterns = [
		r'\bgit\s+branch\s+-d\s+(main|master)',
		r'\bgit\s+update-ref\s+-d\s+refs/heads/(main|master)',
	]
	
	for pattern in main_branch_patterns:
		if re.search(pattern, normalized):
			return True
	
	return False

def is_env_file_access(tool_name, tool_input):
    """
    Check if any tool is trying to access .env files containing sensitive data.
    """
    if tool_name in ['Read', 'Edit', 'MultiEdit', 'Write', 'Bash']:
        # Check file paths for file-based tools
        if tool_name in ['Read', 'Edit', 'MultiEdit', 'Write']:
            file_path = tool_input.get('file_path', '')
            if '.env' in file_path and not file_path.endswith('.env.sample'):
                return True
        
        # Check bash commands for .env file access
        elif tool_name == 'Bash':
            command = tool_input.get('command', '')
            # Pattern to detect .env file access (but allow .env.sample)
            env_patterns = [
                r'\b\.env\b(?!\.sample)',  # .env but not .env.sample
                r'cat\s+.*\.env\b(?!\.sample)',  # cat .env
                r'echo\s+.*>\s*\.env\b(?!\.sample)',  # echo > .env
                r'touch\s+.*\.env\b(?!\.sample)',  # touch .env
                r'cp\s+.*\.env\b(?!\.sample)',  # cp .env
                r'mv\s+.*\.env\b(?!\.sample)',  # mv .env
            ]
            
            for pattern in env_patterns:
                if re.search(pattern, command):
                    return True
    
    return False

def main():
    try:
        # Read JSON input from stdin
        input_data = json.load(sys.stdin)
        
        tool_name = input_data.get('tool_name', '')
        tool_input = input_data.get('tool_input', {})

        # Svelte MCP reminder for src/ files with targeted messages
        if tool_name in ['Read', 'Edit', 'MultiEdit', 'Write']:
            file_path = tool_input.get('file_path', '')
            if file_path and '/src/' in file_path:
                # Choose appropriate message based on operation type
                if tool_name == 'Read':
                    # Proactive guidance when reading (likely planning to edit)
                    message = random.choice(SVELTE_READ_MESSAGES)
                else:
                    # Urgent correction for edit/write operations
                    message = random.choice(SVELTE_EDIT_MESSAGES)

                # Send message to stderr (acts as system whisper to LLM)
                print(message, file=sys.stderr)
                # Don't block, just influence (continues execution)

        # Check for .env file access (blocks access to sensitive environment files)
        if is_env_file_access(tool_name, tool_input):
            print("BLOCKED: Access to .env files containing sensitive data is prohibited", file=sys.stderr)
            print("Use .env.sample for template files instead", file=sys.stderr)
            sys.exit(2)  # Exit code 2 blocks tool call and shows error to Claude
        
        # Check for dangerous rm -rf commands and dangerous git commands
        if tool_name == 'Bash':
            command = tool_input.get('command', '')
            
            # Block rm -rf commands with comprehensive pattern matching
            if is_dangerous_rm_command(command):
                print("BLOCKED: Dangerous rm command detected and prevented", file=sys.stderr)
                sys.exit(2)  # Exit code 2 blocks tool call and shows error to Claude
            
            # Block dangerous git commands that could cause data loss
            if is_dangerous_git_command(command):
                print("BLOCKED: Dangerous git command detected and prevented", file=sys.stderr)
                print("This command could cause permanent data loss or remove important git history", file=sys.stderr)
                sys.exit(2)  # Exit code 2 blocks tool call and shows error to Claude
        
        # Ensure log directory exists
        log_dir = Path.cwd() / 'logs'
        log_dir.mkdir(parents=True, exist_ok=True)
        log_path = log_dir / 'pre_tool_use.json'
        
        # Read existing log data or initialize empty list
        if log_path.exists():
            with open(log_path, 'r') as f:
                try:
                    log_data = json.load(f)
                except (json.JSONDecodeError, ValueError):
                    log_data = []
        else:
            log_data = []
        
        # Append new data
        log_data.append(input_data)
        
        # Write back to file with formatting
        with open(log_path, 'w') as f:
            json.dump(log_data, f, indent=2)
        
        sys.exit(0)
        
    except json.JSONDecodeError:
        # Gracefully handle JSON decode errors
        sys.exit(0)
    except Exception:
        # Exit cleanly on any other error
        sys.exit(0)

if __name__ == '__main__':
    main()