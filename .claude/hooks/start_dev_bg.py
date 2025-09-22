#!/usr/bin/env -S uv run --script
# /// script
# requires-python = ">=3.8"
# dependencies = [
#     "psutil",
# ]
# ///

import argparse
import json
import os
import sys
import subprocess
import time
from pathlib import Path

try:
    import psutil
except ImportError:
    psutil = None


def is_port_in_use(port):
    """Check if a port is already in use."""
    if psutil:
        # Use psutil if available (more reliable)
        for conn in psutil.net_connections():
            if conn.laddr.port == port and conn.status == 'LISTEN':
                return True
        return False
    else:
        # Fallback to lsof command
        try:
            result = subprocess.run(
                ['lsof', '-ti', f':{port}'],
                capture_output=True,
                timeout=3
            )
            return result.returncode == 0
        except Exception:
            return False


def kill_processes_on_port(port):
    """Kill all processes using the specified port."""
    killed_pids = []

    if psutil:
        # Use psutil if available (more reliable)
        for proc in psutil.process_iter(['pid', 'name']):
            try:
                for conn in proc.connections():
                    if conn.laddr.port == port and conn.status == 'LISTEN':
                        proc.terminate()
                        killed_pids.append(proc.pid)
                        # Wait a moment then force kill if needed
                        try:
                            proc.wait(timeout=2)
                        except psutil.TimeoutExpired:
                            proc.kill()
                        break
            except (psutil.NoSuchProcess, psutil.AccessDenied, psutil.ZombieProcess):
                continue
    else:
        # Fallback to lsof/kill commands
        try:
            # Get PIDs using the port
            result = subprocess.run(
                ['lsof', '-ti', f':{port}'],
                capture_output=True,
                text=True,
                timeout=3
            )
            if result.returncode == 0 and result.stdout.strip():
                pids = result.stdout.strip().split('\n')
                for pid in pids:
                    try:
                        subprocess.run(['kill', '-15', pid], timeout=2)  # SIGTERM first
                        killed_pids.append(int(pid))
                        time.sleep(1)
                        # Force kill if still running
                        subprocess.run(['kill', '-9', pid], timeout=1, stderr=subprocess.DEVNULL)
                    except (subprocess.TimeoutExpired, ValueError):
                        continue
        except Exception:
            pass

    return killed_pids


def start_dev_server():
    """Start the development server in background if not already running."""
    port = 5173

    # Check if dev server is already running
    if is_port_in_use(port):
        # Kill existing processes on the port to start fresh
        killed_pids = kill_processes_on_port(port)
        time.sleep(1)  # Give processes time to die

        # Verify port is now free
        if is_port_in_use(port):
            return {
                "status": "port_conflict",
                "message": f"Could not free port {port} - processes may still be running",
                "port": port,
                "killed_pids": killed_pids
            }
        else:
            # Port is now free, continue to start new server
            pass

    # Ensure logs directory exists
    log_dir = Path(".claude/logs")
    log_dir.mkdir(parents=True, exist_ok=True)
    log_file = log_dir / "dev-server.log"

    try:
        # Start dev server in background
        with open(log_file, 'w') as f:
            f.write(f"Starting dev server at {time.strftime('%Y-%m-%d %H:%M:%S')}\\n")

        # Use subprocess.Popen to start in background
        process = subprocess.Popen(
            ['pnpm', 'run', 'dev', '--open'],
            stdout=open(log_file, 'a'),
            stderr=subprocess.STDOUT,
            start_new_session=True  # Detach from parent process
        )

        # Give it a moment to start
        time.sleep(2)

        # Verify it started
        if is_port_in_use(port):
            message = f"Dev server started successfully on port {port}"
            if 'killed_pids' in locals():
                message += f" (replaced previous processes: {killed_pids})"
            return {
                "status": "started",
                "message": message,
                "port": port,
                "pid": process.pid,
                "killed_pids": locals().get('killed_pids', [])
            }
        else:
            return {
                "status": "failed",
                "message": f"Failed to start dev server - check {log_file}",
                "log_file": str(log_file)
            }

    except Exception as e:
        return {
            "status": "error",
            "message": f"Error starting dev server: {str(e)}",
            "log_file": str(log_file)
        }


def main():
    try:
        # Parse command line arguments
        parser = argparse.ArgumentParser()
        parser.add_argument('--dry-run', action='store_true',
                          help='Check status without starting server')
        args = parser.parse_args()

        # Read JSON input from stdin if provided
        try:
            input_data = json.loads(sys.stdin.read())
        except (json.JSONDecodeError, EOFError):
            input_data = {}

        if args.dry_run:
            # Just check if server is running
            port = 5173
            running = is_port_in_use(port)
            result = {
                "status": "running" if running else "stopped",
                "port": port
            }
        else:
            # Start the dev server
            result = start_dev_server()

        # Output result as JSON for logging
        output = {
            "hookSpecificOutput": {
                "hookEventName": "SessionStart",
                "devServerStatus": result
            }
        }

        print(json.dumps(output, indent=2))
        sys.exit(0)

    except Exception as e:
        # Handle errors gracefully
        error_output = {
            "hookSpecificOutput": {
                "hookEventName": "SessionStart",
                "devServerStatus": {
                    "status": "error",
                    "message": f"Hook error: {str(e)}"
                }
            }
        }
        print(json.dumps(error_output, indent=2))
        sys.exit(0)


if __name__ == '__main__':
    main()