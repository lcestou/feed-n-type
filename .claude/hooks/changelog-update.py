#!/usr/bin/env -S uv run --script
# /// script
# requires-python = ">=3.8"
# ///

import json
import subprocess
import sys
import re
from pathlib import Path
from datetime import datetime

def get_git_changes():
    """Get information about current git changes"""
    try:
        # Check for staged files
        result = subprocess.run(['git', 'diff', '--cached', '--name-only'], 
                              capture_output=True, text=True, cwd=Path.cwd())
        staged_files = result.stdout.strip().split('\n') if result.stdout.strip() else []
        
        # Check for unstaged files
        result = subprocess.run(['git', 'diff', '--name-only'], 
                              capture_output=True, text=True, cwd=Path.cwd())
        unstaged_files = result.stdout.strip().split('\n') if result.stdout.strip() else []
        
        return {
            'staged_files': [f for f in staged_files if f],
            'unstaged_files': [f for f in unstaged_files if f], 
            'timestamp': datetime.now().isoformat()
        }
        
    except Exception as e:
        return {'error': str(e), 'timestamp': datetime.now().isoformat()}

def has_significant_changes(git_changes):
    """Check if there are significant code changes that warrant changelog update"""
    try:
        all_files = set(git_changes.get('staged_files', []) + git_changes.get('unstaged_files', []))
        all_files.discard('')  # Remove empty strings
        
        # Filter for significant files (exclude logs, temp files, etc.)
        significant_files = [f for f in all_files if not any(
            pattern in f for pattern in [
                'logs/', '.log', '.tmp', 'node_modules/', 
                '.claude/hooks/', 'CHANGELOG.md'
            ]
        )]
        
        return len(significant_files) > 0
        
    except Exception:
        return False

def get_file_diff_details(file_path):
    """Get detailed diff information for a specific file"""
    try:
        # Get the actual diff content
        result = subprocess.run(['git', 'diff', '--', file_path], 
                              capture_output=True, text=True, cwd=Path.cwd())
        diff_content = result.stdout
        
        # Also check staged changes
        staged_result = subprocess.run(['git', 'diff', '--cached', '--', file_path], 
                                     capture_output=True, text=True, cwd=Path.cwd())
        if staged_result.stdout:
            diff_content += staged_result.stdout
        
        return diff_content
    except Exception:
        return ""

def analyze_semantic_changes(files_with_diffs):
    """Analyze semantic meaning of changes using git diff content"""
    added_entries = []
    changed_entries = []
    
    for file_path, diff_content in files_with_diffs.items():
        if not diff_content:
            continue
            
        # Count additions vs modifications
        added_lines = len([line for line in diff_content.split('\n') if line.startswith('+')])
        removed_lines = len([line for line in diff_content.split('\n') if line.startswith('-')])
        
        # Detect new files (more additions than deletions)
        is_new_file = added_lines > removed_lines * 2
        
        # Analyze file type and content
        if file_path.endswith('.svelte'):
            if is_new_file:
                if 'component' in file_path.lower() or 'lib/' in file_path:
                    component_name = Path(file_path).stem
                    added_entries.append(f"- **{component_name} component**: New interactive component for enhanced user experience")
                elif 'routes/' in file_path:
                    if '+page.svelte' in file_path:
                        route_parts = file_path.split('/')
                        route_name = route_parts[-2] if len(route_parts) > 2 and route_parts[-2] != 'routes' else 'main'
                        added_entries.append(f"- **{route_name} page**: New page with enhanced functionality")
                    else:
                        page_name = Path(file_path).stem
                        added_entries.append(f"- **{page_name} page**: New page component")
            else:
                # Check what was modified
                if 'id=' in diff_content and '+' in diff_content:
                    changed_entries.append("- **Accessibility improvements**: Added semantic IDs for better interaction handling")
                elif 'class=' in diff_content or 'style' in diff_content:
                    changed_entries.append("- **UI styling**: Enhanced visual design and component styling")
                elif 'function' in diff_content or 'let' in diff_content:
                    changed_entries.append("- **Component logic**: Improved component functionality and state management")
                
        elif file_path.endswith('.ts') or file_path.endswith('.js'):
            if is_new_file:
                added_entries.append(f"- **{Path(file_path).stem} utility**: New TypeScript utility for enhanced functionality")
            else:
                changed_entries.append("- **Logic improvements**: Enhanced JavaScript/TypeScript functionality")
                
        elif file_path.endswith('.css'):
            if is_new_file:
                added_entries.append("- **Custom styling**: New CSS styles for improved visual design")
            else:
                changed_entries.append("- **Style updates**: Enhanced visual styling and design consistency")
    
    return added_entries, changed_entries

def analyze_changes(git_changes):
    """Analyze git changes with semantic understanding using diff content"""
    try:
        all_files = git_changes.get('staged_files', []) + git_changes.get('unstaged_files', [])
        significant_files = [f for f in all_files if f and not any(
            pattern in f for pattern in [
                'logs/', '.log', '.tmp', 'node_modules/', 
                '.claude/hooks/', 'CHANGELOG.md', '.git/'
            ]
        )]
        
        if not significant_files:
            return []
        
        # Get diff details for each file
        files_with_diffs = {}
        for file_path in significant_files:
            diff_content = get_file_diff_details(file_path)
            if diff_content:
                files_with_diffs[file_path] = diff_content
        
        # Perform semantic analysis
        added_entries, changed_entries = analyze_semantic_changes(files_with_diffs)
        
        # Combine entries (prioritize specific over generic)
        all_entries = []
        
        # Add specific semantic entries first
        all_entries.extend(added_entries)
        all_entries.extend(changed_entries)
        
        # Fallback to generic categorization if no semantic matches
        if not all_entries:
            ui_changes = [f for f in significant_files if any(pattern in f for pattern in ['src/routes/', 'src/lib/', 'src/app.', 'static/'])]
            config_changes = [f for f in significant_files if any(pattern in f for pattern in ['package.json', 'tailwind.', 'vite.', 'svelte.', 'docker', 'pnpm-lock'])]
            docs_changes = [f for f in significant_files if any(pattern in f for pattern in ['.md', 'README', 'docs/'])]
            
            if ui_changes:
                all_entries.append("- **UI improvements**: Enhanced user interface components and functionality")
            if config_changes:
                all_entries.append("- **Configuration**: Updated project configuration and build settings")
            if docs_changes and not any('CHANGELOG' in f for f in docs_changes):
                all_entries.append("- **Documentation**: Updated project documentation and guides")
        
        return all_entries[:3]  # Limit to 3 most significant entries
        
    except Exception as e:
        # Fallback to basic analysis
        return []

def update_changelog(entries):
    """Update CHANGELOG.md with new entries, organized by date and categorized into Added/Changed sections"""
    try:
        changelog_path = Path('CHANGELOG.md')
        if not changelog_path.exists():
            return False
        
        # Read current changelog
        with open(changelog_path, 'r') as f:
            content = f.read()
        
        # Find the [Unreleased] section
        unreleased_pattern = r'(## \[Unreleased\]\s*\n)'
        match = re.search(unreleased_pattern, content)
        
        if not match:
            return False
        
        # Get current date for organization
        today = datetime.now().strftime('%Y-%m-%d')
        
        # Get existing entries to avoid duplicates
        insert_pos = match.end()
        next_section = re.search(r'\n## \[', content[insert_pos:])
        existing_section = content[insert_pos:insert_pos + (next_section.start() if next_section else len(content))]
        
        # Check for today's date section
        today_section_pattern = f'#### {today}'
        has_today_section = today_section_pattern in existing_section
        
        # Categorize entries into Added vs Changed
        added_entries = []
        changed_entries = []
        
        for entry in entries:
            # Check if this entry (or similar) already exists
            entry_key = entry.split('**')[1].split('**')[0] if '**' in entry else entry.split(':')[0]
            if entry_key not in existing_section:
                # Determine if it's an addition or change
                if any(keyword in entry.lower() for keyword in ['new ', 'component:', 'page:', 'utility:', 'added']):
                    added_entries.append(entry)
                else:
                    changed_entries.append(entry)
        
        # If no new entries, don't update
        if not added_entries and not changed_entries:
            return False
        
        new_content = content
        
        # Create daily sections with entries
        daily_content = f'\n#### {today}\n\n'
        
        if added_entries:
            daily_content += '**Added:**\n' + '\n'.join(added_entries) + '\n\n'
        
        if changed_entries:
            daily_content += '**Changed:**\n' + '\n'.join(changed_entries) + '\n'
        
        # Insert the daily section
        if has_today_section:
            # Find existing today section and append to it
            today_pattern = f'(#### {today}\\s*\\n)'
            today_match = re.search(today_pattern, existing_section)
            if today_match:
                # Find end of today's section (next #### or ###)
                rest_of_section = existing_section[today_match.end():]
                next_day = re.search(r'\n####', rest_of_section)
                next_category = re.search(r'\n###', rest_of_section)
                
                # Determine where today's section ends
                if next_day and (not next_category or next_day.start() < next_category.start()):
                    end_pos = today_match.end() + next_day.start()
                elif next_category:
                    end_pos = today_match.end() + next_category.start()
                else:
                    end_pos = len(existing_section)
                
                pos = insert_pos + end_pos
                new_content = new_content[:pos] + '\n' + daily_content.strip() + '\n' + new_content[pos:]
        else:
            # Add new daily section at the beginning of Unreleased
            new_content = new_content[:insert_pos] + daily_content + new_content[insert_pos:]
        
        # Only write if content actually changed
        if new_content != content:
            with open(changelog_path, 'w') as f:
                f.write(new_content)
            return True
        
        return False
        
    except Exception:
        return False

def should_update_changelog(input_data):
    """Update changelog when file changes are made (but avoid git operations)"""
    try:
        tool_name = input_data.get('toolName', '')
        
        # Don't update during git operations (to avoid infinite loops)
        if any(keyword in tool_name.lower() for keyword in ['git', 'bash']):
            return False
            
        # Update on file editing operations
        if any(keyword in tool_name.lower() for keyword in ['edit', 'write', 'multiedit']):
            return True
        
        # Update on agent task completions
        if 'task' in tool_name.lower():
            return True
        
        return False
        
    except Exception:
        return False

def main():
    try:
        # Read JSON input from stdin
        input_data = json.load(sys.stdin)
        
        # Only update on specific triggers (commits, builds, etc.)
        if not should_update_changelog(input_data):
            sys.exit(0)
        
        # Get git changes information
        git_changes = get_git_changes()
        
        # Check if changelog update is needed
        if has_significant_changes(git_changes):
            # Analyze changes and generate entries
            entries = analyze_changes(git_changes)
            
            if entries:
                # Update the changelog
                update_changelog(entries)
        
        sys.exit(0)
        
    except json.JSONDecodeError:
        # Handle JSON decode errors gracefully
        sys.exit(0)
    except Exception:
        # Exit cleanly on any other error
        sys.exit(0)

if __name__ == '__main__':
    main()