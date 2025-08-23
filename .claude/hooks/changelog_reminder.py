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
                    # Enhanced pattern analysis for more specific suggestions
                    filename = Path(file).stem
                    suggestions_for_file = []
                    
                    # Function/method analysis
                    if '+export function' in diff_content or '+function ' in diff_content:
                        func_matches = re.findall(r'\+.*?function\s+(\w+)', diff_content)
                        if func_matches:
                            suggestions_for_file.append(f"New function: {func_matches[0]} in {filename}")
                        else:
                            suggestions_for_file.append(f"New functionality in {filename}")
                    
                    # Class/interface analysis
                    if '+class ' in diff_content or '+interface ' in diff_content:
                        class_matches = re.findall(r'\+.*?(?:class|interface)\s+(\w+)', diff_content)
                        if class_matches:
                            suggestions_for_file.append(f"New class/interface: {class_matches[0]} in {filename}")
                    
                    # Component analysis for Svelte files
                    if '.svelte' in file:
                        if '+<script' in diff_content:
                            suggestions_for_file.append(f"Script logic updated in {filename} component")
                        elif '+<style' in diff_content:
                            suggestions_for_file.append(f"Styling updated in {filename} component")
                        elif any(tag in diff_content for tag in ['+<div', '+<button', '+<input', '+<form']):
                            suggestions_for_file.append(f"Template structure updated in {filename} component")
                        else:
                            suggestions_for_file.append(f"Component updates in {filename}")
                    
                    # Configuration file analysis
                    if file.endswith(('.json', '.yaml', '.yml', '.toml', '.env')):
                        if 'package.json' in file:
                            if '+dependencies' in diff_content or '+devDependencies' in diff_content:
                                suggestions_for_file.append(f"Package dependencies updated")
                            elif '+scripts' in diff_content:
                                suggestions_for_file.append(f"NPM scripts updated")
                        elif 'tsconfig.json' in file:
                            suggestions_for_file.append(f"TypeScript configuration updated")
                        else:
                            suggestions_for_file.append(f"Configuration updated: {filename}")
                    
                    # Import/dependency analysis
                    if '+import' in diff_content and not suggestions_for_file:
                        import_matches = re.findall(r'\+import.*?from [\'"]([^\'"]+)[\'"]', diff_content)
                        if import_matches:
                            suggestions_for_file.append(f"New import: {import_matches[0]} in {filename}")
                        else:
                            suggestions_for_file.append(f"Dependencies updated in {filename}")
                    
                    # Bug fix detection
                    if any(word in diff_content.lower() for word in ['fix', 'bug', 'error', 'issue']):
                        suggestions_for_file.append(f"Bug fixes in {filename}")
                    
                    # Hook/automation analysis
                    if 'hooks/' in file or 'scripts/' in file:
                        suggestions_for_file.append(f"Automation script updated: {filename}")
                    
                    # Default fallback
                    if not suggestions_for_file:
                        suggestions_for_file.append(f"Updates in {filename}")
                    
                    suggestions.extend(suggestions_for_file)
                    
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
                    if 'New functionality' in suggestion or 'Component' in suggestion or 'Script logic' in suggestion or 'Template structure' in suggestion or 'New function' in suggestion or 'New class' in suggestion:
                        # Use the specific suggestion directly instead of generic transformation
                        added_items.append(f"- **{suggestion}**")
            
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
                    if 'fix' in suggestion.lower() or 'Bug fixes' in suggestion or 'Dependencies updated' in suggestion or 'Updates in' in suggestion or 'Automation script' in suggestion:
                        # Use the specific suggestion directly
                        changed_items.append(f"- **{suggestion}**")
            
            if categories['docs']:
                changed_items.append("- **Documentation**: Updated project documentation")
            
            if changed_items:
                new_entry_parts.append("**Changed:**\n")
                new_entry_parts.extend(f"{item}\n" for item in changed_items)
            
            # Insert new entry after [Unreleased]
            new_entry = "".join(new_entry_parts)
            insert_pos = unreleased_match.end()
            
            # Check if today's entry already exists and update accordingly
            if self.has_todays_entry():
                # Find today's entry and its content
                today_entry_pattern = re.escape(today_entry)
                # Match from today's date until the next date entry or major section
                match = re.search(f'({today_entry_pattern})(.*?)(?=\n####|\n##|$)', content, re.DOTALL)
                if match:
                    existing_content = match.group(2)
                    # Find where to insert within today's section
                    # Look for existing Added/Changed sections
                    has_added = '**Added:**' in existing_content
                    has_changed = '**Changed:**' in existing_content
                    
                    # Separate new items by category
                    new_added_items = []
                    new_changed_items = []
                    current_section = None
                    
                    for line in new_entry_parts[1:]:  # Skip date header
                        if '**Added:**' in line:
                            current_section = 'added'
                        elif '**Changed:**' in line:
                            current_section = 'changed'
                        elif line.strip().startswith('- '):
                            if current_section == 'added':
                                new_added_items.append(line.strip())
                            elif current_section == 'changed':
                                new_changed_items.append(line.strip())
                    
                    # Insert new items into appropriate existing sections
                    updated_content = content
                    
                    # Add to existing Added: section (within today's date only)
                    if new_added_items and has_added:
                        # Find today's section boundaries
                        today_start = existing_content.find('**Added:**')
                        today_end = existing_content.find('**Changed:**', today_start) if '**Changed:**' in existing_content[today_start:] else len(existing_content)
                        
                        # Add items right after the **Added:** header within today's section
                        added_header_pos = match.start() + len(match.group(1)) + today_start + len('**Added:**\n')
                        new_items = '\n'.join(new_added_items) + '\n'
                        updated_content = content[:added_header_pos] + new_items + content[added_header_pos:]
                    
                    # Add to existing Changed: section (within today's date only)
                    if new_changed_items and has_changed:
                        # Find Changed section within today's content
                        changed_start = existing_content.find('**Changed:**')
                        if changed_start != -1:
                            changed_header_pos = match.start() + len(match.group(1)) + changed_start + len('**Changed:**\n')
                            new_items = '\n'.join(new_changed_items) + '\n'
                            updated_content = content[:changed_header_pos] + new_items + content[changed_header_pos:]
                    
                    # Create new sections if they don't exist
                    if new_added_items and not has_added:
                        new_section = "**Added:**\n" + '\n'.join(new_added_items) + '\n\n'
                        # Insert after today's date
                        date_pos = updated_content.find(today_entry) + len(today_entry)
                        updated_content = updated_content[:date_pos] + '\n\n' + new_section + updated_content[date_pos:]
                    
                    if new_changed_items and not has_changed:
                        new_section = "**Changed:**\n" + '\n'.join(new_changed_items) + '\n\n'
                        # Insert at end of today's section
                        next_date = updated_content.find('\n####', updated_content.find(today_entry))
                        if next_date == -1:
                            updated_content = updated_content.rstrip() + '\n\n' + new_section
                        else:
                            updated_content = updated_content[:next_date] + '\n' + new_section + updated_content[next_date:]
                    
                    if new_added_items or new_changed_items:
                        self.changelog_path.write_text(updated_content)
                        print(f"✅ Updated existing {today_entry} entry in CHANGELOG.md")
                    else:
                        print(f"ℹ️  No new changes to add to {today_entry} entry")
                    return True
            else:
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