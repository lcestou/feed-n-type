#!/usr/bin/env -S uv run --script
# /// script
# requires-python = ">=3.8"
# ///
"""
Smart changelog generator with advanced semantic analysis and duplicate prevention.
Replaces the old changelog_reminder.py with better intelligence.
"""

import argparse
import json
import os
import re
import subprocess
import sys
from datetime import datetime
from pathlib import Path
from typing import Dict, List, Set, Tuple


class SmartChangelogAnalyzer:
    """Advanced changelog management with semantic analysis and duplicate prevention."""
    
    def __init__(self, root_path: Path = None):
        self.root_path = root_path or Path.cwd()
        self.changelog_path = self.root_path / "CHANGELOG.md"
        
        # Enhanced file type patterns
        self.code_patterns = {'.svelte', '.ts', '.js', '.jsx', '.tsx', '.vue', '.py', '.go', '.rs', '.java', '.cpp', '.c'}
        self.config_patterns = {'.json', '.yml', '.yaml', '.toml', '.env', '.cfg', '.ini', '.conf', '.config'}
        self.doc_patterns = {'.md', '.rst', '.txt', '.doc', '.docx', '.pdf'}
        self.style_patterns = {'.css', '.scss', '.sass', '.less', '.styl'}
        self.test_patterns = {'.test.', '.spec.', '.e2e.', '_test.', '_spec.'}
        
        # Semantic keyword mapping for better categorization
        self.bug_keywords = {'fix', 'bug', 'error', 'issue', 'repair', 'correct', 'resolve'}
        self.feature_keywords = {'add', 'new', 'create', 'implement', 'introduce', 'feature'}
        self.improvement_keywords = {'update', 'improve', 'enhance', 'optimize', 'refactor', 'upgrade'}
        self.removal_keywords = {'remove', 'delete', 'drop', 'deprecate', 'eliminate'}
        
    def get_git_changes(self) -> Tuple[Set[str], Set[str], bool]:
        """Get uncommitted and staged changes with enhanced detection."""
        try:
            result = subprocess.run(['git', 'status', '--porcelain'], 
                                  capture_output=True, text=True, cwd=self.root_path)
            
            all_changes = set()
            staged = set()
            
            for line in result.stdout.strip().split('\n'):
                if not line:
                    continue
                    
                status = line[:2]
                filename = line[3:].strip()
                
                # Skip .bak files and other temporary files
                if filename.endswith(('.bak', '.tmp', '.temp', '~')):
                    continue
                
                all_changes.add(filename)
                
                if status[0] not in ' ?':
                    staged.add(filename)
            
            changelog_modified = 'CHANGELOG.md' in all_changes
            return all_changes, staged, changelog_modified
            
        except subprocess.CalledProcessError:
            return set(), set(), False
    
    def categorize_files(self, files: Set[str]) -> Dict[str, Set[str]]:
        """Enhanced file categorization with better detection."""
        categories = {
            'code': set(),
            'config': set(),
            'docs': set(),
            'styles': set(),
            'tests': set(),
            'hooks': set(),
            'other': set()
        }
        
        for file in files:
            if not file:
                continue
                
            file_path = Path(file)
            suffix = file_path.suffix.lower()
            filename = file_path.name.lower()
            
            # Special handling for specific paths
            if 'hooks/' in file:
                categories['hooks'].add(file)
            elif any(test_pattern in filename for test_pattern in self.test_patterns):
                categories['tests'].add(file)
            elif suffix in self.style_patterns:
                categories['styles'].add(file)
            elif suffix in self.code_patterns:
                categories['code'].add(file)
            elif suffix in self.config_patterns:
                categories['config'].add(file)
            elif suffix in self.doc_patterns and file != 'CHANGELOG.md':
                categories['docs'].add(file)
            else:
                categories['other'].add(file)
        
        return categories
    
    def analyze_diff_semantic(self, file: str) -> List[str]:
        """Advanced semantic analysis of file changes."""
        try:
            # Get git status for this file
            result = subprocess.run(['git', 'status', '--porcelain', file], 
                                  capture_output=True, text=True, cwd=self.root_path)
            
            if not result.stdout.strip():
                return []
            
            status = result.stdout.strip()[:2]
            
            # Handle deleted files
            if 'D' in status:
                return [f"Removed {Path(file).name}"]
            
            # Handle new files
            if '?' in status or 'A' in status:
                return self._analyze_new_file(file)
            
            # Analyze modifications
            result = subprocess.run(['git', 'diff', 'HEAD', file], 
                                  capture_output=True, text=True, cwd=self.root_path)
            
            if not result.stdout:
                # Try unstaged diff
                result = subprocess.run(['git', 'diff', file], 
                                      capture_output=True, text=True, cwd=self.root_path)
            
            diff_content = result.stdout
            if not diff_content:
                return []
            
            return self._analyze_diff_content(file, diff_content)
            
        except subprocess.CalledProcessError:
            return []
    
    def _analyze_new_file(self, file: str) -> List[str]:
        """Analyze newly added files."""
        file_path = Path(file)
        filename = file_path.stem
        
        if file.endswith('.svelte'):
            return [f"Added new {filename} component"]
        elif file.endswith(('.ts', '.js')):
            if 'util' in filename or 'helper' in filename:
                return [f"Added {filename} utility module"]
            else:
                return [f"Added {filename} module"]
        elif file.endswith('.py'):
            return [f"Added {filename} script"]
        elif 'test' in file or 'spec' in file:
            return [f"Added tests for {filename}"]
        else:
            return [f"Added {filename}"]
    
    def _analyze_diff_content(self, file: str, diff: str) -> List[str]:
        """Deep analysis of diff content for semantic meaning."""
        suggestions = []
        file_path = Path(file)
        filename = file_path.stem
        
        # Count additions and deletions
        added_lines = len([line for line in diff.split('\n') if line.startswith('+')])
        removed_lines = len([line for line in diff.split('\n') if line.startswith('-')])
        
        # Analyze what type of changes were made
        if file.endswith('.svelte'):
            suggestions.extend(self._analyze_svelte_changes(filename, diff))
        elif file.endswith(('.ts', '.js', '.py')):
            suggestions.extend(self._analyze_code_changes(filename, diff))
        elif file.endswith('.json'):
            suggestions.extend(self._analyze_config_changes(filename, diff))
        elif file.endswith('.md'):
            suggestions.extend(self._analyze_doc_changes(filename, diff))
        
        # Fallback to generic analysis
        if not suggestions:
            if added_lines > removed_lines * 2:
                suggestions.append(f"Expanded {filename} with new functionality")
            elif removed_lines > added_lines * 2:
                suggestions.append(f"Simplified {filename} by removing code")
            else:
                suggestions.append(f"Updated {filename}")
        
        return suggestions
    
    def _analyze_svelte_changes(self, filename: str, diff: str) -> List[str]:
        """Analyze Svelte component changes."""
        suggestions = []
        
        if '+<script' in diff or '+ <script' in diff:
            if 'runes' in diff or '$state' in diff or '$derived' in diff:
                suggestions.append(f"Migrated {filename} component to Svelte 5 runes")
            else:
                suggestions.append(f"Updated {filename} component logic")
        
        if '+<style' in diff or '+ <style' in diff:
            suggestions.append(f"Updated {filename} component styling")
        
        if any(tag in diff for tag in ['+<div', '+<button', '+<input', '+<form', '+<nav']):
            suggestions.append(f"Enhanced {filename} component template")
        
        # Check for prop changes
        if '+export let' in diff:
            suggestions.append(f"Added new props to {filename} component")
        
        # Check for event handling
        if '+on:' in diff or '+onclick' in diff:
            suggestions.append(f"Added event handling to {filename} component")
        
        return suggestions
    
    def _analyze_code_changes(self, filename: str, diff: str) -> List[str]:
        """Analyze general code file changes."""
        suggestions = []
        
        # Function analysis
        func_added = len(re.findall(r'\+.*?(?:function|def|const.*?=\s*\()', diff))
        if func_added > 0:
            suggestions.append(f"Added {func_added} new function(s) to {filename}")
        
        # Class analysis
        class_added = len(re.findall(r'\+.*?(?:class|interface)', diff))
        if class_added > 0:
            suggestions.append(f"Added {class_added} new class(es) to {filename}")
        
        # Import analysis
        import_changes = re.findall(r'\+import.*?from [\'"]([^\'"]+)[\'"]', diff)
        if import_changes:
            suggestions.append(f"Added imports for {', '.join(import_changes[:2])} in {filename}")
        
        # Error handling
        if '+try' in diff or '+catch' in diff or '+except' in diff:
            suggestions.append(f"Improved error handling in {filename}")
        
        # Type annotations
        if '+:' in diff and any(t in diff for t in ['string', 'number', 'boolean', 'object']):
            suggestions.append(f"Enhanced type safety in {filename}")
        
        return suggestions
    
    def _analyze_config_changes(self, filename: str, diff: str) -> List[str]:
        """Analyze configuration file changes."""
        if filename == 'package':
            if 'dependencies' in diff:
                deps = re.findall(r'\+"([^"]+)"\s*:', diff)
                if deps:
                    return [f"Added dependencies: {', '.join(deps[:3])}"]
                else:
                    return ["Updated package dependencies"]
            elif 'scripts' in diff:
                return ["Updated npm scripts"]
            else:
                return ["Updated package.json configuration"]
        
        elif filename == 'tsconfig':
            return ["Updated TypeScript configuration"]
        
        elif 'tailwind' in filename:
            return ["Updated Tailwind CSS configuration"]
        
        elif 'svelte' in filename:
            return ["Updated SvelteKit configuration"]
        
        else:
            return [f"Updated {filename} configuration"]
    
    def _analyze_doc_changes(self, filename: str, diff: str) -> List[str]:
        """Analyze documentation changes."""
        if filename.lower() == 'readme':
            if '+##' in diff:
                return ["Updated README with new sections"]
            else:
                return ["Updated README documentation"]
        
        elif 'api' in filename.lower():
            return ["Updated API documentation"]
        
        elif 'claude' in filename.lower():
            return ["Updated AI agent instructions"]
        
        else:
            return [f"Updated {filename} documentation"]
    
    def get_existing_entries_today(self) -> Set[str]:
        """Get normalized entries that already exist for today."""
        if not self.changelog_path.exists():
            return set()
        
        try:
            content = self.changelog_path.read_text()
            today = datetime.now().strftime("#### %Y-%m-%d")
            
            # Find today's section
            today_match = re.search(f'{re.escape(today)}(.*?)(?=\\n####|\\n##|$)', content, re.DOTALL)
            if not today_match:
                return set()
            
            today_content = today_match.group(1)
            entries = set()
            
            # Extract all entries
            for match in re.findall(r'- \*\*([^*]+)\*\*', today_content):
                entries.add(match.strip().lower())
            
            return entries
            
        except Exception:
            return set()
    
    def update_changelog_smart(self, categories: Dict[str, Set[str]]) -> bool:
        """Smart changelog update with semantic analysis and deduplication."""
        if not self.changelog_path.exists():
            print("❌ CHANGELOG.md not found")
            return False
        
        try:
            # Get all semantic suggestions
            all_suggestions = []
            existing_entries = self.get_existing_entries_today()
            
            # Process each category
            for category, files in categories.items():
                if not files:
                    continue
                    
                for file in files:
                    suggestions = self.analyze_diff_semantic(file)
                    for suggestion in suggestions:
                        normalized = suggestion.lower()
                        if normalized not in existing_entries:
                            all_suggestions.append(suggestion)
                            existing_entries.add(normalized)
            
            if not all_suggestions:
                print("ℹ️  No new changes to add to changelog")
                return False
            
            # Categorize suggestions
            added_items = []
            changed_items = []
            
            for suggestion in all_suggestions:
                suggestion_lower = suggestion.lower()
                
                if any(keyword in suggestion_lower for keyword in self.feature_keywords):
                    added_items.append(f"- **{suggestion}**")
                elif any(keyword in suggestion_lower for keyword in self.bug_keywords):
                    changed_items.append(f"- **{suggestion}**")
                elif any(keyword in suggestion_lower for keyword in self.improvement_keywords):
                    changed_items.append(f"- **{suggestion}**")
                else:
                    # Default to changed
                    changed_items.append(f"- **{suggestion}**")
            
            # Update changelog
            return self._insert_changelog_entries(added_items, changed_items)
            
        except Exception as e:
            print(f"❌ Error updating changelog: {e}")
            return False
    
    def _insert_changelog_entries(self, added_items: List[str], changed_items: List[str]) -> bool:
        """Insert entries into changelog with proper formatting."""
        content = self.changelog_path.read_text()
        today = datetime.now().strftime("#### %Y-%m-%d")
        
        # Find unreleased section
        unreleased_match = re.search(r'## \[Unreleased\]', content)
        if not unreleased_match:
            print("❌ [Unreleased] section not found")
            return False
        
        # Check if today's entry exists
        today_match = re.search(f'{re.escape(today)}(.*?)(?=\\n####|\\n##|$)', content, re.DOTALL)
        
        if today_match:
            # Update existing entry
            return self._update_existing_entry(content, today, today_match, added_items, changed_items)
        else:
            # Create new entry
            return self._create_new_entry(content, unreleased_match.end(), today, added_items, changed_items)
    
    def _update_existing_entry(self, content: str, today: str, today_match, added_items: List[str], changed_items: List[str]) -> bool:
        """Update existing changelog entry for today."""
        today_content = today_match.group(1)
        
        # Build new content
        new_sections = []
        
        if added_items:
            new_sections.append("\n**Added:**")
            new_sections.extend(added_items)
            new_sections.append("")
        
        if changed_items:
            new_sections.append("\n**Changed:**")
            new_sections.extend(changed_items)
            new_sections.append("")
        
        if new_sections:
            # Insert after today's header
            new_content = content[:today_match.end()] + "\n".join(new_sections) + content[today_match.end():]
            self.changelog_path.write_text(new_content)
            print(f"✅ Updated {today} entry in CHANGELOG.md")
            return True
        
        return False
    
    def _create_new_entry(self, content: str, insert_pos: int, today: str, added_items: List[str], changed_items: List[str]) -> bool:
        """Create new changelog entry for today."""
        new_entry = [f"\\n{today}\\n"]
        
        if added_items:
            new_entry.append("**Added:**")
            new_entry.extend(added_items)
            new_entry.append("")
        
        if changed_items:
            new_entry.append("**Changed:**")
            new_entry.extend(changed_items)
            new_entry.append("")
        
        new_entry_str = "\\n".join(new_entry)
        new_content = content[:insert_pos] + new_entry_str + content[insert_pos:]
        
        self.changelog_path.write_text(new_content)
        print(f"✅ Created new {today} entry in CHANGELOG.md")
        return True
    
    def run(self, auto_update: bool = False, clean_first: bool = False) -> None:
        """Main execution logic."""
        try:
            # Clean duplicates first if requested
            if clean_first:
                from .changelog_dedup import ChangelogCleaner
                cleaner = ChangelogCleaner(self.changelog_path)
                cleaner.clean_changelog()
            
            all_changes, staged, changelog_modified = self.get_git_changes()
            
            if not all_changes:
                return
            
            if changelog_modified and not auto_update:
                return
            
            categories = self.categorize_files(all_changes)
            
            if auto_update:
                self.update_changelog_smart(categories)
            else:
                # Generate reminder
                self._show_reminder(categories, all_changes)
                
        except Exception as e:
            if os.getenv('DEBUG'):
                print(f"Error in smart changelog: {e}", file=sys.stderr)
    
    def _show_reminder(self, categories: Dict[str, Set[str]], files: Set[str]) -> None:
        """Show intelligent reminder about changelog updates."""
        if not files:
            return
        
        print("\n📝 Smart Changelog Reminder:", file=sys.stderr)
        print("  Changes detected that may need documentation:", file=sys.stderr)
        
        for category, category_files in categories.items():
            if category_files:
                print(f"    • {category.title()}: {len(category_files)} files", file=sys.stderr)
        
        print(f"\n  Run with --auto-update for smart changelog generation", file=sys.stderr)
        print("  🤖 UPDATE CHANGELOG: technical-documentation-writer should update CHANGELOG.md", file=sys.stderr)


def main():
    """Main entry point."""
    parser = argparse.ArgumentParser(description='Smart changelog analyzer with semantic understanding')
    parser.add_argument('--auto-update', action='store_true', help='Auto-update changelog')
    parser.add_argument('--clean-first', action='store_true', help='Clean duplicates before updating')
    parser.add_argument('--debug', action='store_true', help='Enable debug output')
    
    args = parser.parse_args()
    
    if args.debug:
        os.environ['DEBUG'] = '1'
    
    analyzer = SmartChangelogAnalyzer()
    analyzer.run(auto_update=args.auto_update, clean_first=args.clean_first)


if __name__ == '__main__':
    main()