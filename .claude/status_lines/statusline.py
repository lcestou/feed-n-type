#!/usr/bin/env python3
"""Claude Code status line with context visualization."""

import sys
import json
import subprocess
import os
from pathlib import Path


def get_git_info():
    """Get current git branch and last commit time."""
    try:
        # Check if we're in a git repo
        subprocess.run(
            ["git", "rev-parse", "--git-dir"], 
            check=True, 
            capture_output=True, 
            cwd="."
        )
        
        # Get current branch
        branch_result = subprocess.run(
            ["git", "branch", "--show-current"],
            capture_output=True,
            text=True,
            cwd="."
        )
        
        branch = ""
        if branch_result.returncode == 0 and branch_result.stdout.strip():
            branch = branch_result.stdout.strip()
        
        # Get last commit time
        commit_result = subprocess.run(
            ["git", "log", "-1", "--format=%ar"],
            capture_output=True,
            text=True,
            cwd="."
        )
        
        commit_time = ""
        if commit_result.returncode == 0 and commit_result.stdout.strip():
            # Simplify time format
            time_str = commit_result.stdout.strip()
            time_str = time_str.replace(" ago", "")
            time_str = time_str.replace(" seconds", "s")
            time_str = time_str.replace(" second", "s")
            time_str = time_str.replace(" minutes", "m")
            time_str = time_str.replace(" minute", "m")
            time_str = time_str.replace(" hours", "h")
            time_str = time_str.replace(" hour", "h")
            time_str = time_str.replace(" days", "d")
            time_str = time_str.replace(" day", "d")
            time_str = time_str.replace(" weeks", "w")
            time_str = time_str.replace(" week", "w")
            time_str = time_str.replace(" months", "mo")
            time_str = time_str.replace(" month", "mo")
            commit_time = time_str
        
        if branch and commit_time:
            return f" ({branch}, {commit_time})"
        elif branch:
            return f" ({branch})"
        
    except (subprocess.CalledProcessError, FileNotFoundError):
        pass
    
    return ""


def get_project_name():
    """Get project name from package.json, pyproject.toml, or current directory."""
    # Try package.json first (Node.js projects)
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
    
    # Try pyproject.toml (Python projects)
    pyproject_path = Path("pyproject.toml")
    if pyproject_path.exists():
        try:
            import tomllib
        except ImportError:
            try:
                import tomli as tomllib
            except ImportError:
                tomllib = None
        
        if tomllib:
            try:
                with open(pyproject_path, "rb") as f:
                    pyproject_data = tomllib.load(f)
                    name = pyproject_data.get("project", {}).get("name")
                    if name:
                        return name
            except Exception:
                pass
    
    # Fallback to current directory name
    return Path.cwd().name


def create_context_bar(percent, tokens, bar_length=16):
    """Create a background-colored progress bar with percentage and token count."""
    # Calculate filled and empty sections
    filled_chars = int(percent * bar_length / 100)
    empty_chars = bar_length - filled_chars
    
    # ANSI colors - darker, more subtle
    BG_FILLED = "\033[48;5;180m"   # Light muted orange background for black text
    BG_EMPTY = "\033[48;5;240m"    # Dark gray background  
    BLACK_TEXT = "\033[30m"        # Black text
    RESET = "\033[0m"
    
    # Create combined text with percentage and tokens
    tokens_str = format_tokens(tokens)
    percent_str = f"{percent}% ({tokens_str})"
    
    # Build the bar with background colors
    bar_parts = []
    text_start = (bar_length - len(percent_str)) // 2
    
    for i in range(bar_length):
        if text_start <= i < text_start + len(percent_str):
            # This position has percentage text
            text_char = percent_str[i - text_start]
            if i < filled_chars:
                bar_parts.append(f"{BG_FILLED}{BLACK_TEXT}{text_char}")
            else:
                bar_parts.append(f"{BG_EMPTY}{BLACK_TEXT}{text_char}")
        else:
            # This position is just background
            if i < filled_chars:
                bar_parts.append(f"{BG_FILLED} ")
            else:
                bar_parts.append(f"{BG_EMPTY} ")
    
    return "".join(bar_parts) + RESET




def format_duration(duration_ms):
    """Format duration in milliseconds to human readable."""
    if duration_ms < 60000:
        return f"{duration_ms // 1000}s"
    elif duration_ms < 3600000:  # Less than 1 hour
        return f"{duration_ms // 60000}m"
    else:
        hours = duration_ms // 3600000
        minutes = (duration_ms % 3600000) // 60000
        return f"{hours}h{minutes}m"




def format_tokens(tokens):
    """Format token count to readable format."""
    if tokens < 1000:
        return f"{tokens}"
    elif tokens < 1000000:
        return f"{tokens // 1000}K"
    else:
        return f"{tokens // 1000000}M"


def get_last_prompt_from_session(session_id):
    """Get the last prompt from the session file."""
    try:
        # Try different session file paths
        cwd_path = str(Path.cwd()).replace("/", "-")
        if cwd_path.startswith("-"):
            cwd_path = cwd_path[1:]
        
        project_dir = Path.home() / ".claude" / "projects" / f"-{cwd_path}"
        
        if project_dir.exists():
            # Find the most recent session file in the project directory
            session_files = list(project_dir.glob("*.jsonl"))
            if session_files:
                # Get the most recently modified session file
                session_file = max(session_files, key=lambda p: p.stat().st_mtime)
            else:
                return "No sessions in project"
        else:
            # Fallback to session_id if provided
            session_file = Path.home() / ".claude" / "projects" / f"{session_id}.jsonl"
            if not session_file.exists():
                return f"No project dir: {project_dir.name}"
        
        # Read the last line that contains a user prompt
        last_prompt = "No prompts found"
        with open(session_file, 'r') as f:
            for line in f:
                try:
                    entry = json.loads(line.strip())
                    if entry.get('type') == 'user' and not entry.get('isVisibleInTranscriptOnly'):
                        # Check for different content structures
                        content = entry.get('content') or entry.get('message', {}).get('content')
                        if content:
                            if isinstance(content, list) and len(content) > 0:
                                # Get text from content array
                                text_parts = [item.get('text', '') for item in content if item.get('type') == 'text']
                                if text_parts:
                                    prompt_text = ' '.join(text_parts)
                                    # Skip hook messages and system content
                                    if not any(skip in prompt_text.lower() for skip in [
                                        'edit operation feedback', 
                                        '.claude/hooks/',
                                        'user-prompt-submit-hook',
                                        'critical: always follow'
                                    ]):
                                        last_prompt = prompt_text
                            elif isinstance(content, str):
                                # Skip hook messages and system content
                                if not any(skip in content.lower() for skip in [
                                    'edit operation feedback',
                                    '.claude/hooks/', 
                                    'user-prompt-submit-hook',
                                    'critical: always follow'
                                ]):
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


def main():
    """Generate Claude Code status line."""
    try:
        # Read JSON input from Claude Code
        input_data = json.load(sys.stdin)
        
        # Extract data from JSON
        model = input_data.get("model", {}).get("display_name", "Unknown")
        transcript_path = input_data.get("transcript_path", "")
        
        # Get version dynamically from Claude binary symlink
        try:
            claude_path = Path.home() / ".local/bin/claude"
            if claude_path.exists() and claude_path.is_symlink():
                # Extract version from symlink target path
                target = str(claude_path.resolve())
                if "/versions/" in target:
                    claude_version = target.split("/versions/")[-1]
                else:
                    claude_version = input_data.get("version", "Unknown")
            else:
                claude_version = input_data.get("version", "Unknown")
        except:
            claude_version = input_data.get("version", "Unknown")
        
        session_id = input_data.get("session_id", "")
        
        # Get project info
        project_name = get_project_name()
        git_info = get_git_info()
        
        # Get recent prompt info
        last_prompt = get_last_prompt_from_session(session_id)
        prompt_icon = get_prompt_icon(last_prompt)
        truncated_prompt = truncate_prompt(last_prompt)
        
        # Simple fallback: estimate tokens from file size
        tokens, context_percent = 0, 0
        if transcript_path and Path(transcript_path).exists():
            file_size = Path(transcript_path).stat().st_size
            tokens = file_size * 10 // 62  # Simple ratio-based estimate
            context_percent = min(100, (tokens * 100) // 200000)  # 200k token limit
        
        # Try to get ccusage data for more accurate metrics
        ccusage_time_left = None
        try:
            import subprocess
            import re
            ccusage_result = subprocess.run(
                ["npx", "-y", "ccusage@latest", "statusline"], 
                input=json.dumps(input_data),
                capture_output=True,
                text=True,
                timeout=3
            )
            if ccusage_result.returncode == 0 and ccusage_result.stdout.strip():
                ccusage_line = ccusage_result.stdout.strip()
                
                # Extract tokens and percentage from ccusage output
                token_match = re.search(r'🧠\s*([\d,]+)\s*\((\d+)%\)', ccusage_line)
                if token_match:
                    ccusage_tokens_str = token_match.group(1).replace(',', '')
                    tokens = int(ccusage_tokens_str)
                    context_percent = int(token_match.group(2))
                
                # Extract time left from ccusage (e.g., "2h 9m left")
                time_match = re.search(r'\((\d+)h\s*(\d+)m\s*left\)', ccusage_line)
                if time_match:
                    hours_left = int(time_match.group(1))
                    minutes_left = int(time_match.group(2))
                    ccusage_time_left = (hours_left, minutes_left)
        except Exception:
            pass  # Use fallback data
        
        context_bar = create_context_bar(context_percent, tokens)
        
        # Get additional metrics
        cost_info = input_data.get("cost", {})
        total_duration = cost_info.get("total_duration_ms", 0)
        lines_added = cost_info.get("total_lines_added", 0)
        lines_removed = cost_info.get("total_lines_removed", 0)
        
        # Format metrics
        duration_str = format_duration(total_duration)
        tokens_str = format_tokens(tokens)
        
        # ANSI color codes - using more vibrant colors
        GREEN = "\033[92m"    # Bright green for project name
        BLUE = "\033[96m"     # Bright cyan for git info (more visible than blue)
        YELLOW = "\033[93m"   # Bright yellow for context bar
        CYAN = "\033[94m"     # Bright blue for duration (swapped with git)
        MAGENTA = "\033[95m"  # Bright magenta for lines changed
        RESET = "\033[0m"     # Reset color
        
        # Use 256-color ANSI codes like ccstatusline - might bypass fade bug
        GREEN_256 = "\033[38;5;46m"    # Bright green (256-color)
        CYAN_256 = "\033[38;5;37m"     # Muted cyan (256-color)  
        YELLOW_256 = "\033[38;5;226m"  # Bright yellow (256-color)
        BLUE_256 = "\033[38;5;27m"     # Bright blue (256-color)
        MAGENTA_256 = "\033[38;5;201m" # Bright magenta (256-color)
        GRAY_256 = "\033[38;5;246m"    # Muted gray (256-color) for reset time
        
        # Calculate reset time using ccusage data if available
        from datetime import datetime, timedelta
        now = datetime.now()
        
        if ccusage_time_left:
            # Use ccusage's accurate time remaining
            hours_left, minutes_left = ccusage_time_left
            reset_time = now + timedelta(hours=hours_left, minutes=minutes_left)
        else:
            # Fallback: Assume 5-hour blocks starting at midnight
            hours_since_midnight = now.hour + now.minute / 60
            current_block = int(hours_since_midnight // 5)
            next_reset_hour = (current_block + 1) * 5
            if next_reset_hour >= 24:
                next_reset_hour = 0
                reset_time = now.replace(hour=next_reset_hour, minute=0, second=0) + timedelta(days=1)
            else:
                reset_time = now.replace(hour=int(next_reset_hour), minute=0, second=0)
        
        reset_time_str = reset_time.strftime("%-I%p").lower()
        
        # Multi-line statusline
        status_line_1 = (
            f"📁{GREEN_256}{project_name}{RESET}{CYAN_256}{git_info}{RESET} "
            f"🧠{context_bar} "
            f"⏱️ {CYAN}{duration_str}{RESET} "
            f"📝{MAGENTA}+{lines_added}/-{lines_removed}{RESET}"
        )
        
        # Second line with model, reset time, and version info
        status_line_2 = (
            f"🤖{YELLOW}{model}{RESET} "
            f"🔄{GRAY_256}Reset ({reset_time_str}){RESET} "
            f"📦{MAGENTA}{claude_version}{RESET}"
        )
        
        # Third line with recent prompt
        status_line_3 = f"{prompt_icon}{CYAN_256}{truncated_prompt}{RESET}"
        
        print(status_line_1)
        print(status_line_2)
        print(status_line_3, end="")
        
    except Exception as e:
        # Fallback status line if something goes wrong
        print(f"[Error] Status line failed: {str(e)}", end="", file=sys.stderr)
        fallback_name = Path.cwd().name
        print(f"📁 {fallback_name} │ [░░░░░░░░░░] 0%", end="")


if __name__ == "__main__":
    main()