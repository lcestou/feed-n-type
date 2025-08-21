#!/bin/bash
# Professional console error monitoring for Claude integration
# Reads browser localStorage via Chrome DevTools Protocol

echo "=== Browser Console Monitoring ==="

# Check if dev server is running
if ! curl -s http://localhost:5173 > /dev/null 2>&1; then
    echo "Dev server not running - no console logs to check"
    exit 0
fi

# Method 1: Check for any stored error logs in a simple way
TEMP_HTML=$(mktemp).html
cat > "$TEMP_HTML" << 'EOF'
<!DOCTYPE html>
<html>
<head><title>Console Log Checker</title></head>
<body>
<script>
try {
    const errors = JSON.parse(localStorage.getItem('claude_console_logs') || '[]');
    const devErrors = JSON.parse(localStorage.getItem('claude_dev_errors') || '[]');
    
    if (errors.length > 0 || devErrors.length > 0) {
        console.log('=== RECENT CONSOLE ERRORS ===');
        [...errors, ...devErrors].slice(-3).forEach(err => {
            console.log(`[${err.timestamp}] ${err.level || 'ERROR'}: ${err.message}`);
        });
    } else {
        console.log('No recent console errors detected');
    }
} catch (e) {
    console.log('Unable to check console logs:', e.message);
}
</script>
</body>
</html>
EOF

# Try multiple methods to check for console errors
ERROR_FOUND=false

# Method 1: Check recent dev server log activity
# Check only project-local dev.log in .claude folder
LOG_FILE=".claude/dev.log"
if [ -f "$LOG_FILE" ] && [ -s "$LOG_FILE" ]; then
	# Auto-rotate log if it gets too big (>200 lines)
	LINE_COUNT=$(wc -l < "$LOG_FILE" 2>/dev/null || echo 0)
	if [ "$LINE_COUNT" -gt 200 ]; then
		echo "Rotating log file ($LINE_COUNT lines)..."
		tail -100 "$LOG_FILE" > "$LOG_FILE.tmp" && mv "$LOG_FILE.tmp" "$LOG_FILE"
	fi
	
	echo "Recent dev server activity ($LOG_FILE):"
	tail -15 "$LOG_FILE"
	ERROR_FOUND=true
fi

# Alternative: Check if dev process is running and try to capture recent output
if [ "$ERROR_FOUND" = false ] && pgrep -f "pnpm.*dev\|vite.*dev" >/dev/null 2>&1; then
    echo "Dev server running but no errors found in log files"
    echo "Tip: Console errors should appear as '🌐 BROWSER ERROR FOR CLAUDE:' in your dev terminal"
fi

# Method 2: Use headless browser if available
if command -v google-chrome >/dev/null 2>&1; then
    BROWSER_OUTPUT=$(timeout 5s google-chrome --headless --disable-gpu --no-sandbox --dump-dom "file://$TEMP_HTML" 2>/dev/null | grep -E "(RECENT CONSOLE ERRORS|ERROR:|WARN:|No recent)" | head -5)
    if [ -n "$BROWSER_OUTPUT" ]; then
        echo "$BROWSER_OUTPUT"
        ERROR_FOUND=true
    fi
elif command -v chromium >/dev/null 2>&1; then
    BROWSER_OUTPUT=$(timeout 5s chromium --headless --disable-gpu --no-sandbox --dump-dom "file://$TEMP_HTML" 2>/dev/null | grep -E "(RECENT CONSOLE ERRORS|ERROR:|WARN:|No recent)" | head -5)
    if [ -n "$BROWSER_OUTPUT" ]; then
        echo "$BROWSER_OUTPUT"
        ERROR_FOUND=true
    fi
fi

# Fallback message
if [ "$ERROR_FOUND" = false ]; then
    echo "No recent console errors detected (run console.error('test') to verify monitoring)"
fi

# Cleanup
rm -f "$TEMP_HTML"