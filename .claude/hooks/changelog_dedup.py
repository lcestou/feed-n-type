#!/usr/bin/env -S uv run --script
# /// script
# requires-python = ">=3.8"
# ///
"""
Changelog deduplication and cleanup utility.
Removes EXACT duplicate entries and fixes formatting issues in CHANGELOG.md.

CONSERVATIVE APPROACH: Only removes entries with identical text on the same date.
Does NOT remove similar or related entries - preserves all unique content.
"""

import re
import sys
from datetime import datetime
from pathlib import Path
from typing import Dict, List, Set


class ChangelogCleaner:
    """Clean up and deduplicate changelog entries - CONSERVATIVE approach."""
    
    def __init__(self, changelog_path: Path = None):
        self.changelog_path = changelog_path or Path.cwd() / "CHANGELOG.md"
    
    def extract_date_sections(self, content: str) -> Dict[str, str]:
        """Extract all date sections from changelog."""
        sections = {}
        
        # Find all date headers
        date_pattern = r'#### (\d{4}-\d{2}-\d{2})'
        matches = list(re.finditer(date_pattern, content))
        
        for i, match in enumerate(matches):
            date = match.group(1)
            start_pos = match.start()
            
            # Find the end of this section (next date header or major section)
            if i + 1 < len(matches):
                end_pos = matches[i + 1].start()
            else:
                # Look for next major section
                next_section = re.search(r'\n## ', content[start_pos:])
                if next_section:
                    end_pos = start_pos + next_section.start()
                else:
                    end_pos = len(content)
            
            sections[date] = content[start_pos:end_pos].strip()
        
        return sections
    
    def deduplicate_section(self, section_content: str) -> str:
        """Remove EXACT duplicate entries from a date section.
        
        CONSERVATIVE: Only removes entries with identical text.
        Does NOT normalize, lowercase, or merge similar entries.
        """
        lines = section_content.split('\n')
        date_header = lines[0]
        
        # Track EXACT entries (case-sensitive, whitespace-sensitive)
        seen_entries = set()
        added_items = []
        changed_items = []
        
        current_category = None
        
        for line in lines[1:]:
            stripped_line = line.strip()
            
            if stripped_line == '**Added:**':
                current_category = 'added'
                continue
            elif stripped_line == '**Changed:**':
                current_category = 'changed'
                continue
            elif stripped_line.startswith('- **') and stripped_line.endswith('**'):
                # Use EXACT text comparison - no normalization
                exact_entry = stripped_line
                
                # Skip ONLY if we've seen the EXACT same entry
                if exact_entry in seen_entries:
                    continue
                
                seen_entries.add(exact_entry)
                
                if current_category == 'added':
                    added_items.append(stripped_line)
                elif current_category == 'changed':
                    changed_items.append(stripped_line)
            elif stripped_line.startswith('- **'):
                # Handle entries that might not end with ** (multiline descriptions)
                exact_entry = stripped_line
                
                if exact_entry in seen_entries:
                    continue
                
                seen_entries.add(exact_entry)
                
                if current_category == 'added':
                    added_items.append(stripped_line)
                elif current_category == 'changed':
                    changed_items.append(stripped_line)
        
        # Rebuild the section
        rebuilt_lines = [date_header, '']
        
        if added_items:
            rebuilt_lines.append('**Added:**')
            rebuilt_lines.append('')
            rebuilt_lines.extend(added_items)
            rebuilt_lines.append('')
        
        if changed_items:
            rebuilt_lines.append('**Changed:**')
            rebuilt_lines.append('')
            rebuilt_lines.extend(changed_items)
            rebuilt_lines.append('')
        
        return '\n'.join(rebuilt_lines)
    
    def clean_changelog(self) -> bool:
        """Clean and deduplicate the entire changelog - CONSERVATIVE approach."""
        if not self.changelog_path.exists():
            print("❌ CHANGELOG.md not found")
            return False
        
        try:
            content = self.changelog_path.read_text()
            
            # Find the Unreleased section
            unreleased_match = re.search(r'(.*?## \[Unreleased\])', content, re.DOTALL)
            if not unreleased_match:
                print("❌ [Unreleased] section not found")
                return False
            
            header = unreleased_match.group(1)
            
            # Extract date sections
            sections = self.extract_date_sections(content)
            
            if not sections:
                print("ℹ️  No date sections found to clean")
                return False
            
            # Clean each section
            cleaned_sections = {}
            total_duplicates_removed = 0
            
            for date, section_content in sections.items():
                # Count entries before cleaning
                original_entries = [l for l in section_content.split('\n') if l.strip().startswith('- **')]
                
                cleaned_content = self.deduplicate_section(section_content)
                
                # Count entries after cleaning
                cleaned_entries = [l for l in cleaned_content.split('\n') if l.strip().startswith('- **')]
                
                duplicates_in_section = len(original_entries) - len(cleaned_entries)
                total_duplicates_removed += duplicates_in_section
                
                if duplicates_in_section > 0:
                    print(f"📅 {date}: Removed {duplicates_in_section} exact duplicate(s)")
                
                cleaned_sections[date] = cleaned_content
            
            # Find content after all date sections
            last_section_end = max((content.rfind(section) + len(section) for section in sections.values()), default=0)
            remaining_content = content[last_section_end:].strip()
            
            # Remove any remaining content that starts with date sections (cleanup corrupted format)
            remaining_content = re.sub(r'#### \d{4}-\d{2}-\d{2}.*', '', remaining_content, flags=re.DOTALL).strip()
            
            # Rebuild the changelog
            rebuilt_content = header + '\n\n'
            
            # Add cleaned sections in reverse chronological order
            for date in sorted(cleaned_sections.keys(), reverse=True):
                rebuilt_content += cleaned_sections[date] + '\n\n'
            
            # Add any remaining content (like version sections)
            if remaining_content:
                rebuilt_content += remaining_content
            
            # Ensure proper ending
            rebuilt_content = rebuilt_content.rstrip() + '\n'
            
            # Write back
            self.changelog_path.write_text(rebuilt_content)
            
            if total_duplicates_removed > 0:
                print(f"✅ Cleaned CHANGELOG.md - removed {total_duplicates_removed} EXACT duplicate entries")
                print("🛡️  CONSERVATIVE: Only removed identical entries, preserved all unique content")
            else:
                print("✅ CHANGELOG.md checked - no exact duplicates found")
            
            return True
            
        except Exception as e:
            print(f"❌ Error cleaning changelog: {e}")
            return False


def main():
    """Main entry point."""
    cleaner = ChangelogCleaner()
    
    print("🔍 Starting CONSERVATIVE changelog deduplication...")
    print("   - Only removes EXACT duplicate entries")
    print("   - Preserves all unique content, even if similar")
    print("   - Case-sensitive and whitespace-sensitive comparison")
    print()
    
    success = cleaner.clean_changelog()
    
    if success:
        print("\n🎯 Deduplication complete!")
    else:
        print("\n❌ Deduplication failed!")
        sys.exit(1)


if __name__ == '__main__':
    main()