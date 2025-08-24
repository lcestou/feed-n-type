# MCP Servers Reference

**PRIORITY**: Always use MCP servers over standard tools when available. MCP servers provide enhanced functionality and better integration.

## Available MCP Servers

### 🌐 Web & Search

- **mcp**fetch**fetch**: Fetch web content, convert HTML to markdown
- **mcp**brave-search**brave_web_search**: General web search (20 results max)
- **mcp**brave-search**brave_local_search**: Local business/location search

### 🧠 Memory & Knowledge

- **mcp**memory**\***: Knowledge graph operations
  - `create_entities`, `create_relations`, `add_observations`
  - `delete_entities`, `delete_observations`, `delete_relations`
  - `read_graph`, `search_nodes`, `open_nodes`

### 📚 Documentation & Libraries

- **mcp**context7**resolve-library-id**: Resolve package names to Context7 IDs
- **mcp**context7**get-library-docs**: Get up-to-date library documentation

### 🤔 Advanced Thinking

- **mcp**sequential-thinking**sequentialthinking**: Multi-step problem solving with revision capability

### 🌐 Browser Automation

#### Playwright MCP
- **mcp**playwright**browser\_\***: Full browser control
  - Navigation: `navigate`, `navigate_back`, `navigate_forward`
  - Interaction: `click`, `type`, `hover`, `drag`, `select_option`
  - Analysis: `snapshot`, `take_screenshot`, `evaluate`
  - Tabs: `tab_list`, `tab_new`, `tab_select`, `tab_close`
  - System: `close`, `resize`, `install`, `console_messages`

#### BrowserMCP (Lightweight Alternative)
- **mcp**browsermcp**browser\_\***: Simplified browser automation
  - Navigation: `browser_navigate`, `browser_go_back`, `browser_go_forward`
  - Interaction: `browser_click`, `browser_type`, `browser_hover`, `browser_select_option`
  - Analysis: `browser_snapshot`, `browser_screenshot`, `browser_get_console_logs`
  - Input: `browser_press_key`, `browser_wait`
  - **Note**: Lighter weight than Playwright, good for simpler automation tasks

### 💻 IDE Integration

- **mcp**ide**getDiagnostics**: VS Code language diagnostics
- **mcp**ide**executeCode**: Jupyter kernel code execution

### ⏰ Time Operations

- **mcp**time**get_current_time**: Current time in specific timezones
- **mcp**time**convert_time**: Convert between timezones

### 🔧 Advanced File Operations (Serena)

- **mcp**serena**\***: Sophisticated codebase operations
  - **Search**: `search_for_pattern`, `find_file`, `list_dir`
  - **Symbols**: `get_symbols_overview`, `find_symbol`, `find_referencing_symbols`
  - **Editing**: `replace_symbol_body`, `insert_after_symbol`, `insert_before_symbol`, `replace_regex`
  - **Memory**: `write_memory`, `read_memory`, `list_memories`, `delete_memory`
  - **System**: `restart_language_server`, `switch_modes`, `get_current_config`
  - **Project**: `onboarding`, `check_onboarding_performed`, `remove_project`
  - **Workflow**: `think_about_*`, `summarize_changes`, `prepare_for_new_conversation`

### 📄 Resource Management

- **ListMcpResourcesTool**: List all available MCP resources
- **ReadMcpResourceTool**: Read specific MCP resource content

## Usage Priorities

1. **MCP servers FIRST** - Always check if MCP version exists
2. **Serena for code** - Use mcp**serena** for all codebase operations
3. **Playwright for browser** - Use mcp**playwright** over manual browser tools
4. **Context7 for docs** - Use mcp**context7** for library documentation
5. **Standard tools** - Only when no MCP equivalent exists

## Common Workflows

### Code Analysis

```
1. mcp__serena__get_symbols_overview - Get file structure
2. mcp__serena__find_symbol - Find specific code
3. mcp__serena__find_referencing_symbols - Find usages
```

### Web Research

```
1. mcp__brave-search__brave_web_search - Search web
2. mcp__fetch__fetch - Get detailed content
3. mcp__memory__create_entities - Store findings
```

### Library Documentation

```
1. mcp__context7__resolve-library-id - Get library ID
2. mcp__context7__get-library-docs - Get current docs
```

### Browser Testing

#### Using Playwright (Full-featured)
```
1. mcp__playwright__browser_navigate - Go to URL
2. mcp__playwright__browser_snapshot - Analyze page
3. mcp__playwright__browser_click - Interact
4. mcp__playwright__browser_evaluate - Execute JS
```

#### Using BrowserMCP (Lightweight)
```
1. mcp__browsermcp__browser_navigate - Go to URL
2. mcp__browsermcp__browser_snapshot - Analyze page
3. mcp__browsermcp__browser_click - Interact
4. mcp__browsermcp__browser_wait - Wait for timing
```

## Best Practices

- **Always** check MCP availability before using standard tools
- Use **mcp**serena\*\*\*\* for any file or code operations
- Use **mcp**playwright\*\*\*\* for any browser interactions
- Use **mcp**context7\*\*\*\* for library documentation
- Use **mcp**memory\*\*\*\* to store important project knowledge
- Use **mcp**sequential-thinking\*\*\*\* for complex problem solving

## Adding MCP Servers Back

If you lose your MCP server configurations, here are the commands to add them back:

### Global MCP Servers (User-level)

**Note**: Default scope is `local` (project-level). Use `--scope user` for global user-level servers.

```bash
# Fetch - Web content fetching (add --scope user for global)
claude mcp add fetch --scope user -- uvx mcp-server-fetch

# Memory - Knowledge graph operations (add --scope user for global)
claude mcp add memory --scope user -- npx -y @modelcontextprotocol/server-memory

# Brave Search - Web and local search (requires API key, add --scope user for global)
claude mcp add brave-search --scope user -- npx -y @modelcontextprotocol/server-brave-search
# Set environment variable: BRAVE_API_KEY=YOUR_API_KEY

# Sequential Thinking - Advanced problem solving (add --scope user for global)
claude mcp add sequential-thinking --scope user -- npx -y @modelcontextprotocol/server-sequential-thinking

# Playwright - Browser automation (full-featured, add --scope user for global)
claude mcp add playwright --scope user -- npx @playwright/mcp@latest --isolated

# BrowserMCP - Lightweight browser automation alternative (explicitly user-scoped)
claude mcp add browsermcp --scope user "npx" "@browsermcp/mcp@latest"

# Context7 - Library documentation (add --scope user for global)
claude mcp add context7 --scope user -- npx -y @upstash/context7-mcp

# Time - Timezone operations (add --scope user for global)
claude mcp add time --scope user -- uvx mcp-server-time
```

### Project-specific MCP Servers (Local/Default)

```bash
# Serena - Advanced IDE assistant (user-scope for persistence across containers)
claude mcp add serena --scope user -- uvx --from git+https://github.com/oraios/serena serena start-mcp-server --context ide-assistant --project $(pwd)

# Or any server without --scope flag defaults to local/project level
claude mcp add my-server -- /path/to/server
```

### Manual Configuration

If commands don't work, you can manually add to `~/.claude.json`:

```json
{
	"mcpServers": {
		"fetch": {
			"command": "uvx",
			"args": ["mcp-server-fetch"]
		},
		"memory": {
			"command": "npx",
			"args": ["-y", "@modelcontextprotocol/server-memory"]
		},
		"brave-search": {
			"command": "npx",
			"args": ["-y", "@modelcontextprotocol/server-brave-search"],
			"env": {
				"BRAVE_API_KEY": "API-KEY"
			}
		},
		"sequential-thinking": {
			"command": "npx",
			"args": ["-y", "@modelcontextprotocol/server-sequential-thinking"]
		},
		"playwright": {
			"command": "npx",
			"args": ["@playwright/mcp@latest", "--isolated"]
		},
		"browsermcp": {
			"command": "npx",
			"args": ["@browsermcp/mcp@latest"]
		},
		"context7": {
			"command": "npx",
			"args": ["-y", "@upstash/context7-mcp"]
		},
		"time": {
			"command": "uvx",
			"args": ["mcp-server-time"]
		},
		"serena": {
			"command": "uvx",
			"args": [
				"--from",
				"git+https://github.com/oraios/serena",
				"serena",
				"start-mcp-server",
				"--context",
				"ide-assistant",
				"--project",
				"/app/projects/svelte-infinity_concepts"
			]
		}
	}
}
```

**Reference**: [Claude Code MCP Documentation](https://docs.anthropic.com/en/docs/claude-code/mcp)

## Troubleshooting & Session Recovery

### Common Issues

#### Edit Tool Not Working
If you encounter issues with the Edit tool not working:
1. **Restart the session** - This often resolves temporary state issues
2. **Verify file was read** - Always use Read tool before Edit
3. **Check exact string matching** - Edit requires exact string matches including whitespace
4. **Use MultiEdit for multiple changes** - More reliable for batch edits

#### MCP Server Connection Lost
If MCP servers become unavailable:
1. Check server status with `ListMcpResourcesTool`
2. Restart specific server if needed
3. Re-add server using commands above
4. Verify environment variables are set

#### Session State Issues
When experiencing persistent issues:
- **Clear context**: Use `/clear` between major tasks
- **Restart session**: Sometimes necessary for clean state
- **Check hooks**: Verify hooks aren't blocking operations
- **Validate paths**: Ensure working directory is correct

### Quick Recovery Commands

```bash
# Check MCP server status
claude mcp list

# Restart all MCP servers
claude mcp restart

# Check Claude configuration
cat ~/.claude.json

# Verify project-specific settings
cat .claude/claude.json
```

### Best Practices for Stability

1. **Always read before edit** - Prevents state mismatches
2. **Use MCP servers first** - More reliable than standard tools
3. **Batch operations** - Run multiple commands in parallel
4. **Regular saves** - Commit working changes frequently
5. **Clear context** - Between unrelated tasks to prevent confusion

**Last Updated**: Session restart fixes most edit issues - always worth trying first!