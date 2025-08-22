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
    """Analyze git changes and generate changelog entries"""
    try:
        all_files = git_changes.get('staged_files', []) + git_changes.get('unstaged_files', [])
        significant_files = [f for f in all_files if f and not any(
            pattern in f for pattern in [
                'logs/', '.log', '.tmp', 'node_modules/', 
                '.claude/hooks/', 'CHANGELOG.md'
            ]
        )]
        
        # Categorize changes
        ui_changes = [f for f in significant_files if any(pattern in f for pattern in ['src/routes/', 'src/lib/', 'src/app.'])]
        config_changes = [f for f in significant_files if any(pattern in f for pattern in ['package.json', 'tailwind.', 'vite.', 'svelte.'])]
        
        entries = []
        
        if ui_changes:
            if any('layout' in f.lower() for f in ui_changes):
                entries.append("- **Layout improvements**: Updated site layout with sticky footer and full-width styling")
            if any('page' in f for f in ui_changes):
                entries.append("- **UI enhancements**: Improved main page design and user interface")
            if any('header' in f.lower() for f in ui_changes):
                entries.append("- **Navigation updates**: Enhanced header navigation with improved iconography")
        
        if config_changes:
            entries.append("- **Configuration updates**: Updated project configuration and build settings")
        
        # Generic fallback
        if not entries and significant_files:
            entries.append(f"- **Code improvements**: Updated {len(significant_files)} files for better functionality")
        
        return entries
        
    except Exception:
        return []

def update_changelog(entries):
    """Update CHANGELOG.md with new entries"""
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
        
        # Insert new entries after [Unreleased]
        insert_pos = match.end()
        
        # Check if there are already entries in Unreleased section
        next_section = re.search(r'\n## \[', content[insert_pos:])
        existing_content = content[insert_pos:insert_pos + (next_section.start() if next_section else len(content))].strip()
        
        # Add new entries
        new_entries = '\n### Changed\n\n' + '\n'.join(entries) + '\n'
        
        if existing_content:
            # If there's existing content, add to it
            if '### Changed' in existing_content:
                # Find existing Changed section and add to it
                changed_pattern = r'(### Changed\s*\n)'
                changed_match = re.search(changed_pattern, existing_content)
                if changed_match:
                    # Insert after existing Changed header
                    pos = insert_pos + changed_match.end()
                    new_content = content[:pos] + '\n'.join(entries) + '\n' + content[pos:]
                else:
                    # Add new Changed section
                    new_content = content[:insert_pos] + new_entries + content[insert_pos:]
            else:
                # Add new Changed section at the beginning
                new_content = content[:insert_pos] + new_entries + content[insert_pos:]
        else:
            # No existing content, add new section
            new_content = content[:insert_pos] + new_entries + content[insert_pos:]
        
        # Write updated changelog
        with open(changelog_path, 'w') as f:
            f.write(new_content)
        
        return True
        
    except Exception:
        return False

def main():
    try:
        # Read JSON input from stdin
        input_data = json.load(sys.stdin)
        
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