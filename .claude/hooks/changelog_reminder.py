#!/usr/bin/env -S uv run --script
# /// script
# requires-python = ">=3.8"
# ///

import argparse
import json
import os
import re
import subprocess
import sys
from datetime import datetime
from pathlib import Path
from typing import List, Set, Tuple


class ChangelogAnalyzer:
    """Intelligent changelog management for Feed & Type project."""
    
    def __init__(self, root_path: Path = None):
        self.root_path = root_path or Path.cwd()
        self.changelog_path = self.root_path / "CHANGELOG.md"
        
        # File type categorization patterns
        self.code_patterns = {'.svelte', '.ts', '.js', '.jsx', '.tsx', '.vue', '.py'}
        self.config_patterns = {'.json', '.yml', '.yaml', '.toml', '.env', '.cfg', '.ini'}
        self.doc_patterns = {'.md', '.rst', '.txt', '.doc', '.docx'}
        
    def get_git_changes(self) -> Tuple[Set[str], Set[str], bool]:
        """Get uncommitted and staged changes, plus changelog modification status."""
        try:
            # Get ALL changes using git status --porcelain for complete detection
            result = subprocess.run(['git', 'status', '--porcelain'], 
                                  capture_output=True, text=True, cwd=self.root_path)
            
            all_changes = set()
            staged = set()
            for line in result.stdout.strip().split('\n'):
                if not line:
                    continue
                # Parse git status format: XY filename
                # X = staged status, Y = unstaged status
                status = line[:2]
                filename = line[3:].strip()
                
                # Add to all changes regardless of status
                all_changes.add(filename)
                
                # Check if staged (X position not space or ?)
                if status[0] not in ' ?':
                    staged.add(filename)
            
            # Check if CHANGELOG.md is modified
            changelog_modified = 'CHANGELOG.md' in all_changes
            
            return all_changes, staged, changelog_modified
            
        except subprocess.CalledProcessError:
            return set(), set(), False
    
    def categorize_changes(self, files: Set[str]) -> dict:
        """Categorize changes into code, config, and documentation."""
        categories = {
            'code': set(),
            'config': set(), 
            'docs': set(),
            'other': set()
        }
        
        for file in files:
            if not file:  # Skip empty strings
                continue
                
            file_path = Path(file)
            suffix = file_path.suffix.lower()
            
            if suffix in self.code_patterns:
                categories['code'].add(file)
            elif suffix in self.config_patterns:
                categories['config'].add(file)
            elif suffix in self.doc_patterns and file != 'CHANGELOG.md':
                categories['docs'].add(file)
            else:
                categories['other'].add(file)
                
        return categories
    
    def analyze_code_changes(self, files: Set[str]) -> List[str]:
        """Analyze code changes to suggest changelog entries."""
        suggestions = []
        
        # Get git status to identify file states
        result = subprocess.run(['git', 'status', '--porcelain'], 
                              capture_output=True, text=True, cwd=self.root_path)
        
        file_states = {}
        for line in result.stdout.strip().split('\n'):
            if not line:
                continue
            status = line[:2]
            filename = line[3:].strip()
            file_states[filename] = status
        
        for file in files:
            try:
                status = file_states.get(file, '  ')
                
                # Handle deleted files
                if 'D' in status:
                    suggestions.append(f"Removed {file}")
                    continue
                
                # Handle new files
                if '?' in status or 'A' in status:
                    if '.svelte' in file:
                        suggestions.append(f"New component: {file}")
                    elif any(file.endswith(ext) for ext in ['.ts', '.js', '.py']):
                        suggestions.append(f"New module: {file}")
                    else:
                        suggestions.append(f"Added {file}")
                    continue
                
                # Analyze modified files
                result = subprocess.run(['git', 'diff', file], 
                                      capture_output=True, text=True, cwd=self.root_path)
                diff_content = result.stdout
                
                if diff_content:
                    # Analyze diff patterns
                    if '+export' in diff_content or '+function' in diff_content:
                        suggestions.append(f"New functionality in {file}")
                    elif '+component' in diff_content.lower() or '.svelte' in file:
                        suggestions.append(f"Component updates in {file}")
                    elif '+import' in diff_content:
                        suggestions.append(f"Dependencies updated in {file}")
                    elif 'fix' in diff_content.lower():
                        suggestions.append(f"Bug fixes in {file}")
                    
            except subprocess.CalledProcessError:
                continue
                
        return suggestions
    
    def get_current_date_entry(self) -> str:
        """Get today's date in changelog format."""
        return datetime.now().strftime("#### %Y-%m-%d")
    
    def has_todays_entry(self) -> bool:
        """Check if changelog already has today's entry."""
        if not self.changelog_path.exists():
            return False
            
        try:
            content = self.changelog_path.read_text()
            today_entry = self.get_current_date_entry()
            return today_entry in content
        except Exception:
            return False
    
    def auto_update_changelog(self, categories: dict, suggestions: List[str]) -> bool:
        """Automatically update changelog with analyzed changes."""
        if not self.changelog_path.exists():
            print("❌ CHANGELOG.md not found")
            return False
            
        try:
            content = self.changelog_path.read_text()
            
            # Find [Unreleased] section
            unreleased_match = re.search(r'## \[Unreleased\]', content)
            if not unreleased_match:
                print("❌ [Unreleased] section not found in CHANGELOG.md")
                return False
            
            # Generate new entry
            today_entry = self.get_current_date_entry()
            new_entry_parts = [f"\n{today_entry}\n"]
            
            # Added section
            added_items = []
            if categories['code']:
                for suggestion in suggestions:
                    if 'New functionality' in suggestion or 'Component' in suggestion:
                        added_items.append(f"- **{suggestion.split(' in ')[0]}**: Enhanced {Path(suggestion.split(' in ')[1]).stem} implementation")
            
            if categories['config']:
                added_items.append("- **Configuration updates**: Updated project configuration files")
            
            if added_items:
                new_entry_parts.append("**Added:**\n")
                new_entry_parts.extend(f"{item}\n" for item in added_items)
                new_entry_parts.append("\n")
            
            # Changed section
            changed_items = []
            if categories['code']:
                for suggestion in suggestions:
                    if 'fix' in suggestion.lower():
                        changed_items.append(f"- **Bug fixes**: Resolved issues in {Path(suggestion.split(' in ')[1]).stem}")
                    elif 'Dependencies' in suggestion:
                        changed_items.append(f"- **Dependencies**: Updated imports in {Path(suggestion.split(' in ')[1]).stem}")
            
            if categories['docs']:
                changed_items.append("- **Documentation**: Updated project documentation")
            
            if changed_items:
                new_entry_parts.append("**Changed:**\n")
                new_entry_parts.extend(f"{item}\n" for item in changed_items)
            
            # Insert new entry after [Unreleased]
            new_entry = "".join(new_entry_parts)
            insert_pos = unreleased_match.end()
            
            # Check if today's entry already exists
            if self.has_todays_entry():
                print(f"ℹ️  Today's entry already exists in CHANGELOG.md")
                return True
            
            # Insert the new entry
            updated_content = content[:insert_pos] + new_entry + content[insert_pos:]
            self.changelog_path.write_text(updated_content)
            
            print(f"✅ Auto-updated CHANGELOG.md with {today_entry} entry")
            return True
            
        except Exception as e:
            print(f"❌ Error updating changelog: {e}")
            return False
    
    def generate_reminder(self, categories: dict, files: Set[str], suggestions: List[str]) -> str:
        """Generate contextual changelog reminder."""
        if not files:
            return ""
        
        lines = ["📝 Reminder: Consider updating CHANGELOG.md based on recent changes:"]
        
        # Categorized change detection
        if categories['code']:
            lines.append("  • Component/feature changes detected")
            if suggestions:
                lines.append(f"    Suggestions: {', '.join(suggestions[:2])}")
        
        if categories['config']:
            lines.append("  • Configuration changes detected")
        
        if categories['docs']:
            lines.append("  • Documentation changes detected")
        
        if categories['other']:
            lines.append("  • Other file changes detected")
        
        # Show modified files (limited)
        sorted_files = sorted(files)
        display_files = sorted_files[:3]
        lines.append(f"  Modified files: {' '.join(display_files)}")
        
        if len(sorted_files) > 3:
            lines.append(f"  ... and {len(sorted_files) - 3} more files")
        
        # Add helpful suggestion with agent trigger
        if not self.has_todays_entry():
            today = self.get_current_date_entry()
            lines.append(f"  💡 Tip: Run with --auto-update to create {today} entry automatically")
            lines.append("")
            lines.append("🤖 UPDATE CHANGELOG: technical-documentation-writer should update CHANGELOG.md with today's entry")
        
        return '\n'.join(lines)
    
    def run(self, auto_update: bool = False) -> None:
        """Main execution logic."""
        try:
            all_changes, staged, changelog_modified = self.get_git_changes()
            
            # Skip if no changes or changelog already modified
            if not all_changes:
                return
            
            if changelog_modified and not auto_update:
                return  # Changelog already being worked on
            
            # Analyze changes
            categories = self.categorize_changes(all_changes)
            suggestions = self.analyze_code_changes(categories['code'])
            
            # Auto-update if requested
            if auto_update and (categories['code'] or categories['config']):
                if self.auto_update_changelog(categories, suggestions):
                    return
            
            # Generate and display reminder
            reminder = self.generate_reminder(categories, all_changes, suggestions)
            if reminder:
                print(reminder, file=sys.stderr)
                
        except Exception as e:
            # Fail silently to avoid disrupting workflow
            if os.getenv('DEBUG'):
                print(f"Error in changelog reminder: {e}", file=sys.stderr)


def main():
    """Main entry point with command line argument parsing."""
    parser = argparse.ArgumentParser(description='Intelligent changelog reminder and auto-updater')
    parser.add_argument('--auto-update', action='store_true', 
                       help='Automatically update changelog based on detected changes')
    parser.add_argument('--debug', action='store_true',
                       help='Enable debug output')
    
    args = parser.parse_args()
    
    if args.debug:
        os.environ['DEBUG'] = '1'
    
    analyzer = ChangelogAnalyzer()
    analyzer.run(auto_update=args.auto_update)


if __name__ == '__main__':
    main()