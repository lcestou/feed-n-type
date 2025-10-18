---
description: Security audit and vulnerability scanning with proactive threat prevention
allowed-tools: Task
argument-hint: "[focus area or 'full']"
---

Comprehensive security analysis and vulnerability remediation

**CRITICAL**: Agent must use TodoWrite tool to track security progress and keep user informed

## Usage

- `/secure` - Full security audit of entire codebase
- `/secure dependencies` - Scan npm packages for vulnerabilities
- `/secure input validation` - Review user input handling
- `/secure auth` - Security review of authentication flows
- `/secure full` - Complete security assessment with remediation

## What it does

1. **Threat Assessment**: Identifies potential security vulnerabilities
2. **Code Analysis**: Reviews for common security anti-patterns
3. **Dependency Scanning**: Checks npm packages for known vulnerabilities
4. **Input Validation**: Ensures proper sanitization and validation
5. **Fix Implementation**: Applies security patches and improvements
6. **Quality Gates**: Runs `bun format && bun lint && bun check && bun build` before completion

**Progress Tracking**: Agent updates todo showing vulnerabilities found and fixes applied

## Tech Stack Security Focus

- **MCP Priority**: Uses **mcp**serena**\*** for precise code analysis
- **SvelteKit 2**: Server-side security, route protection, CSRF prevention
- **TypeScript**: Type safety to prevent injection vulnerabilities
- **Gaming Context**: Child safety, data privacy, secure user interactions
- **Client-side**: XSS prevention, secure data handling

## Security Areas

- **Input Validation**: User data sanitization, type checking
- **Authentication**: Session management, secure storage
- **Dependencies**: Vulnerable package detection and updates
- **Data Privacy**: User information protection, GDPR compliance
- **Client Security**: XSS prevention, secure API calls
- **Gaming Safety**: Child-appropriate content filtering, safe interactions

## Vulnerability Categories

- **High Priority**: Remote code execution, data exposure
- **Medium Priority**: Input validation, dependency issues
- **Low Priority**: Information disclosure, configuration hardening
- **Compliance**: COPPA, GDPR, accessibility security

## Best suited for

- Pre-deployment security validation
- Dependency update security review
- New feature security assessment
- Compliance requirement verification
- Incident response and remediation

**Tip**: Specify areas like "user input", "file uploads", or "authentication" for focused scans
