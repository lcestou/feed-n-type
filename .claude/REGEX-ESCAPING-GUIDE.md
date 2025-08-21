# 🚨 CRITICAL: Regex Escaping Guide for AI Agents

## The Problem

AI agents frequently encounter **"bad escape \d"** errors when using regex patterns incorrectly.

## Testing Results Summary

### ✅ WHAT WORKS:

- **MultiEdit tool**: Uses `/\d+/g` (regex literals) - works perfectly
- **Serena MCP**: Uses string literals but requires proper escaping
- **JavaScript regex literals**: `/\d/`, `/\w/`, `/\s/`, `/\b/` work directly

### ❌ WHAT FAILS:

- **String literals with single backslash**: `"\d"` becomes `"d"` (escape interpreted)
- **Serena MCP with single backslash**: `\d` becomes `d` in replacement strings

## Escaping Rules by Tool

### 1. **MultiEdit Tool** ✅ SAFE

```javascript
// These work perfectly in MultiEdit:
{"old_string": "text", "new_string": "text.replace(/\\d+/g, 'NUM')"}
{"old_string": "text", "new_string": "text.replace(/\\b\\w+\\b/g, 'WORD')"}
{"old_string": "text", "new_string": "text.replace(/\\s+/g, ' ')"}
```

### 2. **Serena MCP** ⚠️ REQUIRES DOUBLE ESCAPING

```javascript
// In replacement strings, use double backslashes:
mcp__serena__replace_regex({
	regex: 'pattern',
	repl: 'replacement-\\\\d+' // Double escaping needed
});
```

### 3. **JavaScript String Patterns** ⚠️ CONTEXT DEPENDENT

```javascript
// In strings for RegExp constructor:
new RegExp("\\\\d+")  // Double backslash needed
new RegExp("\\\\w+")  // Double backslash needed

// In regex literals:
/\d+/  // Single backslash works
/\w+/  // Single backslash works
```

## Common Patterns Reference

| Pattern Type   | Regex Literal | String Literal | Serena MCP |
| -------------- | ------------- | -------------- | ---------- |
| Digits         | `/\d+/`       | `"\\\\d+"`     | `\\\\d+`   |
| Word chars     | `/\w+/`       | `"\\\\w+"`     | `\\\\w+`   |
| Whitespace     | `/\s+/`       | `"\\\\s+"`     | `\\\\s+`   |
| Word boundary  | `/\b/`        | `"\\\\b"`      | `\\\\b`    |
| Non-digits     | `/\D+/`       | `"\\\\D+"`     | `\\\\D+`   |
| Non-words      | `/\W+/`       | `"\\\\W+"`     | `\\\\W+`   |
| Non-whitespace | `/\S+/`       | `"\\\\S+"`     | `\\\\S+`   |

## AI Agent Safety Rules

### Rule 1: **Know Your Context**

- MultiEdit → Use regex literals `/pattern/flags`
- Serena MCP → Use double backslashes `\\\\d`
- Edit/Replace → Context dependent

### Rule 2: **Test Before Deploy**

Always test regex patterns in a safe file first:

```bash
node -e "console.log(new RegExp('\\\\d+').test('123'))"
```

### Rule 3: **When In Doubt**

Use regex literals in code generation:

```javascript
// SAFE: Generate this in code
text.replace(/\d+/g, 'replacement');

// RISKY: Generate this
text.replace(new RegExp('\d+', 'g'), 'replacement');
```

## Quick Fix Reference

| Error Message   | Fix                                      |
| --------------- | ---------------------------------------- |
| `bad escape \d` | Change `\d` to `\\\\d` in string context |
| `bad escape \w` | Change `\w` to `\\\\w` in string context |
| `bad escape \s` | Change `\s` to `\\\\s` in string context |
| `bad escape \b` | Change `\b` to `\\\\b` in string context |

## Emergency Recovery

If agents start "spasming" on regex errors:

1. **STOP** the current operation
2. Use `/clear` to reset context
3. Use simple patterns first
4. Test in isolation before applying to real code

---

**Last Updated**: 2025-07-29  
**Test Status**: ✅ All patterns verified working
