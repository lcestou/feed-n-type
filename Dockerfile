FROM node:22-bookworm

ENV DEBIAN_FRONTEND=noninteractive

# Install essentials and add GitHub CLI repository
RUN apt-get update && \
    apt-get install -y --no-install-recommends rsync sudo jq git curl gpg && \
    curl -fsSL https://cli.github.com/packages/githubcli-archive-keyring.gpg | gpg --dearmor -o /usr/share/keyrings/githubcli-archive-keyring.gpg && \
    echo "deb [signed-by=/usr/share/keyrings/githubcli-archive-keyring.gpg arch=amd64] https://cli.github.com/packages stable main" > /etc/apt/sources.list.d/github-cli.list && \
    apt-get update && \
    apt-get install -y gh && \
    rm -rf /var/lib/apt/lists/*

# Rename node user to claudeuser and give sudo access
RUN usermod -l claudeuser node && \
    usermod -d /home/claudeuser -m claudeuser && \
    echo 'claudeuser ALL=(ALL) NOPASSWD:ALL' >> /etc/sudoers

# Install dev tools  
RUN npm install -g npm@latest --force && \
    npm install -g pnpm@latest && \
    npm install -g @anthropic-ai/claude-code && \
    npm install -g @google/gemini-cli && \
    chown -R claudeuser:node $(npm -g config get prefix)

# Configure pnpm to avoid permission issues and use local store
RUN mkdir -p /home/claudeuser/.local/share/pnpm && \
    pnpm config set store-dir ~/.local/share/pnpm --global && \
    pnpm config set allow-scripts true --global && \
    chown -R claudeuser:node /home/claudeuser/.local

# Install uv for all users
RUN curl -LsSf https://astral.sh/uv/install.sh | sh && \
    cp /root/.local/bin/uv* /usr/local/bin/ && \
    chmod +x /usr/local/bin/uv*


# Create startup script that uses NAS_ROOT environment variable
RUN echo '#!/bin/bash' > /startup.sh && \
    echo 'echo "=== Dev Container Starting ==="' >> /startup.sh && \
    echo 'echo "🔍 Checking for NAS mount..."' >> /startup.sh && \
    echo '' >> /startup.sh && \
    echo '# Auto-detect platform and choose the right NAS path' >> /startup.sh && \
    echo 'if [ -d "$NAS_DEV_ROOT_LINUX" ]; then' >> /startup.sh && \
    echo '    NAS_ROOT="$NAS_DEV_ROOT_LINUX"' >> /startup.sh && \
    echo '    PLATFORM="Linux"' >> /startup.sh && \
    echo 'elif [ -d "$NAS_DEV_ROOT_MAC" ]; then' >> /startup.sh && \
    echo '    NAS_ROOT="$NAS_DEV_ROOT_MAC"' >> /startup.sh && \
    echo '    PLATFORM="Mac"' >> /startup.sh && \
    echo 'else' >> /startup.sh && \
    echo '    echo "❌ ERROR: No NAS mount found on any platform"' >> /startup.sh && \
    echo '    echo "Checked Linux: $NAS_DEV_ROOT_LINUX"' >> /startup.sh && \
    echo '    echo "Checked Mac: $NAS_DEV_ROOT_MAC"' >> /startup.sh && \
    echo '    exit 1' >> /startup.sh && \
    echo 'fi' >> /startup.sh && \
    echo '' >> /startup.sh && \
    echo 'echo "🖥️  Detected platform: $PLATFORM"' >> /startup.sh && \
    echo '# Check if NAS is mounted and accessible' >> /startup.sh && \
    echo 'if [ ! -d "$NAS_ROOT" ]; then' >> /startup.sh && \
    echo '    echo "❌ ERROR: NAS mount not found at $NAS_ROOT"' >> /startup.sh && \
    echo '    echo "Please ensure NAS is mounted"' >> /startup.sh && \
    echo '    exit 1' >> /startup.sh && \
    echo 'fi' >> /startup.sh && \
    echo '' >> /startup.sh && \
    echo '# Verify we can read from NAS' >> /startup.sh && \
    echo 'if ! ls "$NAS_ROOT" > /dev/null 2>&1; then' >> /startup.sh && \
    echo '    echo "❌ ERROR: Cannot read from NAS mount at $NAS_ROOT"' >> /startup.sh && \
    echo '    echo "Permission denied or mount is not accessible"' >> /startup.sh && \
    echo '    exit 1' >> /startup.sh && \
    echo 'fi' >> /startup.sh && \
    echo '' >> /startup.sh && \
    echo '# NAS integration ready' >> /startup.sh && \
    echo 'echo "✅ NAS mount verified at $NAS_ROOT"' >> /startup.sh && \
    echo '' >> /startup.sh && \
    echo '# Create symlinks from home to NAS items (excluding local-only dirs)' >> /startup.sh && \
    echo 'mkdir -p /home/claudeuser' >> /startup.sh && \
    echo '# Remove existing symlinks' >> /startup.sh && \
    echo 'cd /home/claudeuser && find . -maxdepth 1 -type l -delete' >> /startup.sh && \
    echo '# Define directories that must stay local for tool compatibility' >> /startup.sh && \
    echo 'LOCAL_DIRS=".cursor-server .cache .npm .devcontainer .local"' >> /startup.sh && \
    echo '# Symlink items from NAS (except . .. and local-only dirs)' >> /startup.sh && \
    echo 'cd "$NAS_ROOT" && for item in * .*; do' >> /startup.sh && \
    echo '    if [ "$item" != "." ] && [ "$item" != ".." ]; then' >> /startup.sh && \
    echo '        skip=false' >> /startup.sh && \
    echo '        for local_dir in $LOCAL_DIRS; do' >> /startup.sh && \
    echo '            if [ "$item" = "$local_dir" ]; then' >> /startup.sh && \
    echo '                skip=true && break' >> /startup.sh && \
    echo '            fi' >> /startup.sh && \
    echo '        done' >> /startup.sh && \
    echo '        if [ "$skip" = "false" ]; then' >> /startup.sh && \
    echo '            rm -rf "/home/claudeuser/$item"' >> /startup.sh && \
    echo '            ln -sf "$NAS_ROOT/$item" "/home/claudeuser/$item"' >> /startup.sh && \
    echo '        fi' >> /startup.sh && \
    echo '    fi' >> /startup.sh && \
    echo 'done' >> /startup.sh && \
    echo '' >> /startup.sh && \
    echo '# Source bashrc from NAS or create if missing' >> /startup.sh && \
    echo 'if [ -f "$NAS_ROOT/.bashrc" ]; then' >> /startup.sh && \
    echo '    echo "📄 Loading .bashrc from NAS"' >> /startup.sh && \
    echo '    source "$NAS_ROOT/.bashrc"' >> /startup.sh && \
    echo 'else' >> /startup.sh && \
    echo '    echo "⚠️  NAS .bashrc not found, creating it..."' >> /startup.sh && \
    echo '    cat > "$NAS_ROOT/.bashrc" << '"'"'EOF'"'"'' >> /startup.sh && \
    echo '# Colored prompt with git branch' >> /startup.sh && \
    echo 'PS1="\[\033[01;32m\]\u@dev\[\033[00m\]:\[\033[01;34m\]\W\[\033[00m\]\[\033[01;31m\]\$(git branch 2>/dev/null | grep \"^\\*\" | cut -c3- | sed \"s/\\(.*\\)/ (\\1)/\")\[\033[00m\]\\$ "' >> /startup.sh && \
    echo '' >> /startup.sh && \
    echo '# Colored ls' >> /startup.sh && \
    echo 'alias ls="ls --color=auto"' >> /startup.sh && \
    echo 'alias ll="ls -alF --color=auto"' >> /startup.sh && \
    echo 'alias la="ls -A --color=auto"' >> /startup.sh && \
    echo 'alias l="ls -CF --color=auto"' >> /startup.sh && \
    echo '' >> /startup.sh && \
    echo '# Colored grep' >> /startup.sh && \
    echo 'alias grep="grep --color=auto"' >> /startup.sh && \
    echo 'alias fgrep="fgrep --color=auto"' >> /startup.sh && \
    echo 'alias egrep="egrep --color=auto"' >> /startup.sh && \
    echo '' >> /startup.sh && \
    echo '# Other useful aliases' >> /startup.sh && \
    echo 'alias ..="cd .."' >> /startup.sh && \
    echo 'alias ...="cd ../.."' >> /startup.sh && \
    echo '' >> /startup.sh && \
    echo '# Enhanced dev function - runs dev server with --open and watches logs' >> /startup.sh && \
    echo 'dev() {' >> /startup.sh && \
    echo '    echo "🚀 Starting development server with browser auto-open..."' >> /startup.sh && \
    echo '    pnpm run dev --open &' >> /startup.sh && \
    echo '    DEV_PID=$!' >> /startup.sh && \
    echo '    ' >> /startup.sh && \
    echo '    echo "✅ Dev server started (PID: $DEV_PID)"' >> /startup.sh && \
    echo '    echo "🌐 Opening browser at http://localhost:5173"' >> /startup.sh && \
    echo '    echo "⚡ Press Ctrl+C to stop all processes"' >> /startup.sh && \
    echo '    ' >> /startup.sh && \
    echo '    # Wait for dev server and cleanup on exit' >> /startup.sh && \
    echo '    trap "kill $DEV_PID 2>/dev/null" EXIT' >> /startup.sh && \
    echo '    wait $DEV_PID' >> /startup.sh && \
    echo '}' >> /startup.sh && \
    echo 'EOF' >> /startup.sh && \
    echo '    echo "✅ Created new .bashrc in NAS"' >> /startup.sh && \
    echo '    source "$NAS_ROOT/.bashrc"' >> /startup.sh && \
    echo 'fi' >> /startup.sh && \
    echo '' >> /startup.sh && \
    echo '# Run custom setup script if exists' >> /startup.sh && \
    echo 'if [ -f "$NAS_ROOT/docker-setup.sh" ]; then' >> /startup.sh && \
    echo '    echo "🔧 Running NAS setup script..."' >> /startup.sh && \
    echo '    chmod +x "$NAS_ROOT/docker-setup.sh" && "$NAS_ROOT/docker-setup.sh"' >> /startup.sh && \
    echo 'fi' >> /startup.sh && \
    echo '' >> /startup.sh && \
    echo 'echo "=== Container Ready ==="' >> /startup.sh && \
    echo 'echo "📂 Workspace: /workspace"' >> /startup.sh && \
    echo 'echo "💾 NAS Root: $NAS_ROOT"' >> /startup.sh && \
    echo 'echo "🏠 Home: /home/claudeuser (NAS content + local tool dirs)"' >> /startup.sh && \
    echo 'echo "💡 Type \"dev\" to start development server"' >> /startup.sh && \
    echo 'echo "🖥️  Access: docker exec -it $(basename $(pwd))-dev bash"' >> /startup.sh && \
    echo 'sleep infinity' >> /startup.sh && \
    chmod +x /startup.sh

EXPOSE 5173
CMD ["/startup.sh"]