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
    BG_FILLED = "\033[48;5;28m"    # Dark green background
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


def detect_auto_compact(transcript_path):
    """Detect if auto-compact happened by looking for file size drop."""
    try:
        # Store last known file size in a temp file
        cache_file = Path(transcript_path).parent / ".statusline_cache"
        baseline_file = Path(transcript_path).parent / ".compact_baseline"
        current_size = Path(transcript_path).stat().st_size
        
        # Read previous size
        previous_size = 0
        if cache_file.exists():
            try:
                previous_size = int(cache_file.read_text().strip())
            except:
                previous_size = 0
        
        # Force compaction detection if file is large but no baseline exists
        # This handles the case where user reports compaction happened but we missed it
        compacted = False
        if current_size > 1000000 and not baseline_file.exists():
            # Large file with no baseline = we missed a compaction, force reset
            compacted = True
        elif previous_size > 100000 and current_size < previous_size * 0.6:  # 40% drop from substantial size
            compacted = True
        
        # Update cache file
        cache_file.write_text(str(current_size))
        
        return current_size, compacted
        
    except Exception:
        return Path(transcript_path).stat().st_size if Path(transcript_path).exists() else 0, False


def estimate_context_usage_filesize(transcript_path):
    """Estimate context usage with auto-compact detection."""
    try:
        if not Path(transcript_path).exists():
            return 0, 0
        
        # Detect auto-compact and get current file size
        current_size, compacted = detect_auto_compact(transcript_path)
        
        # Store post-compact baseline
        baseline_file = Path(transcript_path).parent / ".compact_baseline"
        
        if compacted:
            # Auto-compact detected! Reset baseline to current size
            baseline_file.write_text(str(current_size))
            baseline_size = current_size
        else:
            # Read existing baseline or use 0 if none
            baseline_size = 0
            if baseline_file.exists():
                try:
                    baseline_size = int(baseline_file.read_text().strip())
                except:
                    baseline_size = 0
        
        # Calculate size since last compact
        size_since_compact = current_size - baseline_size
        
        # Convert to tokens (our proven ratio)
        estimated_tokens = size_since_compact * 10 // 62
        
        # Standard Claude Code context limit (200k tokens)
        # But after compact, available context is ~160k
        available_tokens = 160000 if baseline_size > 0 else 200000
        percentage = min(100, (estimated_tokens * 100) // available_tokens)
        
        return estimated_tokens, percentage
    except Exception:
        return 0, 0


def parse_real_context_usage(transcript_path):
    """Parse actual token usage from Claude Code transcript JSON."""
    try:
        if not Path(transcript_path).exists():
            return 0, 0
        
        import json
        total_tokens = 0
        
        # Read transcript file (JSON Lines format) - be more aggressive
        with open(transcript_path, 'r', encoding='utf-8') as f:
            for line in f:
                try:
                    entry = json.loads(line.strip())
                    tokens = 0
                    
                    # Check various possible token fields
                    if 'usage' in entry and 'total_tokens' in entry['usage']:
                        tokens = entry['usage']['total_tokens']
                    elif 'tokens' in entry:
                        tokens = entry['tokens']  
                    elif 'input_tokens' in entry and 'output_tokens' in entry:
                        tokens = entry['input_tokens'] + entry['output_tokens']
                    else:
                        # Be more aggressive - estimate tokens from ANY text content
                        text_content = ""
                        
                        # Try to extract text from various fields
                        if 'content' in entry:
                            if isinstance(entry['content'], str):
                                text_content += entry['content']
                            elif isinstance(entry['content'], list):
                                for item in entry['content']:
                                    if isinstance(item, dict) and 'text' in item:
                                        text_content += item['text']
                                    elif isinstance(item, str):
                                        text_content += item
                        
                        if 'message' in entry and isinstance(entry['message'], str):
                            text_content += entry['message']
                        
                        if 'text' in entry and isinstance(entry['text'], str):
                            text_content += entry['text']
                            
                        # Convert text to token estimate (1 token ≈ 3.5 chars for mixed content)
                        if text_content:
                            tokens = len(text_content) // 3
                    
                    total_tokens += tokens
                except (json.JSONDecodeError, KeyError):
                    continue
        
        # Context limit is 200k tokens
        context_limit = 200000
        percentage = min(int((total_tokens / context_limit) * 100), 100)
        
        return total_tokens, percentage
        
    except Exception:
        # Fallback to file size method if JSON parsing fails
        try:
            file_size = Path(transcript_path).stat().st_size
            estimated_tokens = file_size * 10 // 62
            max_tokens = 200000
            percentage = min(100, (estimated_tokens * 100) // max_tokens)
            return estimated_tokens, percentage
        except Exception:
            return 0, 0


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


def create_pie_chart(percentage):
    """Create a visible block timer indicator."""
    if percentage <= 20:
        return "🕐"  # Clock 1 o'clock
    elif percentage <= 40:
        return "🕕"  # Clock 6 o'clock  
    elif percentage <= 60:
        return "🕘"  # Clock 9 o'clock
    elif percentage <= 80:
        return "🕛"  # Clock 12 o'clock
    else:
        return "🔴"  # Red circle (almost full - warning!)


def calculate_block_timer(transcript_path):
    """Calculate progress through current 5-hour Claude Code usage block."""
    try:
        if not Path(transcript_path).exists():
            return "0hr 0m", 0
        
        import json
        from datetime import datetime, timezone
        
        timestamps = []
        
        # Parse transcript for timestamps
        with open(transcript_path, 'r', encoding='utf-8') as f:
            for line in f:
                try:
                    entry = json.loads(line.strip())
                    if 'timestamp' in entry:
                        # Parse ISO timestamp
                        ts = datetime.fromisoformat(entry['timestamp'].replace('Z', '+00:00'))
                        timestamps.append(ts)
                    elif 'created_at' in entry:
                        ts = datetime.fromisoformat(entry['created_at'].replace('Z', '+00:00'))
                        timestamps.append(ts)
                except (json.JSONDecodeError, ValueError):
                    continue
        
        if not timestamps:
            return "0hr 0m", 0
        
        # Find the start of current 5-hour block
        now = datetime.now(timezone.utc)
        first_timestamp = min(timestamps)
        
        # Calculate hours since first timestamp
        time_diff = now - first_timestamp
        total_hours = time_diff.total_seconds() / 3600
        
        # Find which 5-hour block we're in
        block_number = int(total_hours // 5)
        hours_in_block = total_hours - (block_number * 5)
        
        # Format time in current block
        hours = int(hours_in_block)
        minutes = int((hours_in_block - hours) * 60)
        time_str = f"{hours}hr {minutes}m"
        
        # Calculate percentage (0-100%)
        percentage = min(int((hours_in_block / 5) * 100), 100)
        
        return time_str, percentage
        
    except Exception:
        return "0hr 0m", 0


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
        git_info = get_git_info()
        
        # Get both context methods for comparison
        real_tokens, real_percent = parse_real_context_usage(transcript_path)
        est_tokens, est_percent = estimate_context_usage_filesize(transcript_path)
        
        # Get block timer info
        block_time, block_percent = calculate_block_timer(transcript_path)
        block_pie = create_pie_chart(block_percent)
        
        # Use file-size method for main display (proven more accurate!)
        tokens, context_percent = est_tokens, est_percent
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
        CYAN_256 = "\033[38;5;51m"     # Bright cyan (256-color)  
        YELLOW_256 = "\033[38;5;226m"  # Bright yellow (256-color)
        BLUE_256 = "\033[38;5;27m"     # Bright blue (256-color)
        MAGENTA_256 = "\033[38;5;201m" # Bright magenta (256-color)
        
        # Create comparison bars for both methods
        est_bar = create_context_bar(est_percent, est_tokens)
        
        # Calculate actual reset time
        from datetime import datetime, timedelta
        now = datetime.now()
        hours_used = int(block_time.split('hr')[0]) if 'hr' in block_time else 0
        minutes_used = int(block_time.split('hr')[1].split('m')[0]) if 'hr' in block_time and 'm' in block_time else 0
        
        # Calculate when the block will reset
        time_used = timedelta(hours=hours_used, minutes=minutes_used)
        block_duration = timedelta(hours=5)
        reset_time = now + (block_duration - time_used)
        
        # Format as 12-hour time
        reset_time_str = reset_time.strftime("%-I%p").lower()  # e.g., "3pm"
        
        # Single line statusline with reset time at the end
        status_line = (
            f"📁 {GREEN_256}{project_name}{RESET}{CYAN_256}{git_info}{RESET} │ "
            f"{context_bar} │ "
            f"⏱️ {CYAN}{duration_str}{RESET} │ "
            f"{MAGENTA}+{lines_added}/-{lines_removed}{RESET} │ "
            f"{BLUE}Reset ({reset_time_str}){RESET}"
        )
        
        print(status_line, end="")
        
    except Exception as e:
        # Fallback status line if something goes wrong
        print(f"[Error] Status line failed: {str(e)}", end="", file=sys.stderr)
        fallback_name = Path.cwd().name
        print(f"📁 {fallback_name} │ [░░░░░░░░░░] 0%", end="")


if __name__ == "__main__":
    main()