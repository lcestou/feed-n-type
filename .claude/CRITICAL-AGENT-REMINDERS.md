# CRITICAL AGENT REMINDERS

## EDIT WORKFLOW ENFORCEMENT

**ALWAYS remind agents in prompts:**

```
CRITICAL WORKFLOW:
1. Read file completely first
2. Copy content WITHOUT line number prefixes (    42→<content>)
3. Copy ONLY the actual text after the tab
4. Project uses TABS not spaces - maintain exact indentation
5. REGEX ESCAPING: Use double backslashes in regex patterns (\\d instead of \d)
6. Use MultiEdit tool for multiple changes in same file (MUCH FASTER!)
7. Surgical edits only when MultiEdit fails
8. This prevents "String to replace not found" and regex errors
## Formatting Rule

**TABS NOT SPACES**: Project uses TABS for indentation - maintain exact tab formatting when editing files
**REGEX ESCAPING**: Always use double backslashes in regex patterns (\\d instead of \d) to prevent escape errors
```

## WHY THIS IS NEEDED

- Agents see instructions but don't prioritize them until they fail
- Sub-agents don't get memory from previous sessions
- Need explicit reinforcement in every Task prompt
- 99% of edit failures are due to copying line number prefixes

## ORCHESTRATOR CHECKLIST

Before sending any Edit task:

- [ ] Include CRITICAL WORKFLOW reminder in prompt
- [ ] Specify "Read first, no line numbers"
- [ ] Tell agents to use MultiEdit for multiple changes
- [ ] Only use surgical edits if MultiEdit fails

**This file ensures consistency across all sessions.**
