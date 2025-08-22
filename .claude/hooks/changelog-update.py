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

def analyze_changes(git_changes):
    """Analyze git changes and generate changelog entries with better categorization"""
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
        
        # Categorize changes more precisely
        ui_changes = [f for f in significant_files if any(pattern in f for pattern in ['src/routes/', 'src/lib/', 'src/app.', 'static/'])]
        config_changes = [f for f in significant_files if any(pattern in f for pattern in ['package.json', 'tailwind.', 'vite.', 'svelte.', 'docker', 'pnpm-lock'])]
        docs_changes = [f for f in significant_files if any(pattern in f for pattern in ['.md', 'README', 'docs/'])]
        test_changes = [f for f in significant_files if any(pattern in f for pattern in ['test', 'spec', '__tests__'])]
        
        entries = []
        
        # Handle UI changes with more detail
        if ui_changes:
            if any('header' in f.lower() for f in ui_changes):
                entries.append("- **Navigation enhancements**: Updated header navigation with improved user interface")
            elif any('layout' in f.lower() for f in ui_changes):
                entries.append("- **Layout improvements**: Enhanced site layout and component structure")
            elif any('routes' in f for f in ui_changes):
                entries.append("- **Page updates**: Improved page components and user interface")
            elif any('lib' in f for f in ui_changes):
                entries.append("- **Component enhancements**: Updated shared components and utilities")
            else:
                entries.append("- **UI improvements**: Enhanced user interface components and styling")
        
        # Handle configuration changes
        if config_changes:
            if any('package.json' in f for f in config_changes):
                entries.append("- **Dependencies**: Updated project dependencies and package configuration")
            elif any('docker' in f.lower() for f in config_changes):
                entries.append("- **Development environment**: Updated Docker configuration for better development workflow")
            else:
                entries.append("- **Configuration**: Updated project configuration and build settings")
        
        # Handle documentation
        if docs_changes and not any('CHANGELOG' in f for f in docs_changes):
            entries.append("- **Documentation**: Updated project documentation and guides")
        
        # Handle tests
        if test_changes:
            entries.append("- **Testing**: Enhanced test coverage and test utilities")
        
        # Fallback for uncategorized changes
        if not entries and significant_files:
            if len(significant_files) == 1:
                entries.append(f"- **Code enhancement**: Updated {significant_files[0]} for improved functionality")
            else:
                entries.append(f"- **Code improvements**: Enhanced {len(significant_files)} files for better functionality")
        
        return entries
        
    except Exception:
        return []

def update_changelog(entries):
    """Update CHANGELOG.md with new entries, avoiding duplicates"""
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
        
        # Get existing entries to avoid duplicates
        insert_pos = match.end()
        next_section = re.search(r'\n## \[', content[insert_pos:])
        existing_section = content[insert_pos:insert_pos + (next_section.start() if next_section else len(content))]
        
        # Filter out entries that already exist
        new_entries = []
        for entry in entries:
            # Check if this entry (or similar) already exists
            entry_key = entry.split('**')[1] if '**' in entry else entry.split(':')[0]
            if entry_key not in existing_section:
                new_entries.append(entry)
        
        # If no new entries, don't update
        if not new_entries:
            return False
        
        # Find or create Changed section
        if '### Changed' in existing_section:
            # Find existing Changed section and add to it
            changed_pattern = r'(### Changed\s*\n)'
            changed_match = re.search(changed_pattern, existing_section)
            if changed_match:
                # Insert after existing Changed header, but check for existing entries
                pos = insert_pos + changed_match.end()
                # Add entries with proper spacing
                entries_text = '\n'.join(new_entries) + '\n'
                new_content = content[:pos] + entries_text + content[pos:]
            else:
                # This shouldn't happen, but handle gracefully
                new_entries_section = '\n### Changed\n\n' + '\n'.join(new_entries) + '\n'
                new_content = content[:insert_pos] + new_entries_section + content[insert_pos:]
        else:
            # Add new Changed section
            new_entries_section = '\n### Changed\n\n' + '\n'.join(new_entries) + '\n'
            new_content = content[:insert_pos] + new_entries_section + content[insert_pos:]
        
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