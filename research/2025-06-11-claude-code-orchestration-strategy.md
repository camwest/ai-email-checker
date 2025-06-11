# Claude Code Orchestration Strategy

*Research Date: 2025-06-11*
*Status: Planning*

## Overview

Investigation into using Claude Code as an orchestration layer for AI email classification, rather than using Claude Code SDK as a traditional programmatic library.

## Meta Approach Concept

Instead of integrating Claude Code SDK directly into our CLI application, we use Claude Code to orchestrate and call our CLI tools. This creates a "meta" architecture where Claude Code becomes the intelligent controller that uses our Himalaya/CLI tools as building blocks.

## Architecture Pattern

### Originally Planned Approach
```
GitHub Actions → Our CLI → Himalaya + Claude Code SDK → Email Processing
```

### Proposed Meta Approach  
```
GitHub Actions → Claude Code → Our CLI Tools → Himalaya → Email Processing
```

### Enhanced Meta Approach (with MCP)
```
GitHub Actions → Claude Code + MCP Server → Email Processing Tools → Himalaya
```

## Reference Implementation

Based on patterns from [`claude-code-base-action`](https://github.com/anthropics/claude-code-base-action):

### Key Components from claude-code-base-action

1. **Process Orchestration** (`src/run-claude.ts:103-304`)
   - Spawns Claude Code CLI process with configured arguments
   - Uses named pipes for prompt input/output streaming
   - Captures JSON-formatted execution results
   - Handles timeouts and error conditions

2. **Configuration Management** (`src/run-claude.ts:62-101`)
   - Prepares Claude Code CLI arguments from GitHub Action inputs
   - Supports tool allowlists/denylists, max turns, system prompts
   - Handles custom environment variables for Claude Code execution

3. **Prompt Management** (`src/index.ts:15-18`)
   - Supports both inline prompts and prompt files
   - Validates prompt sources and prepares for Claude Code execution

4. **GitHub Actions Integration** (`action.yml:85-153`)
   - Installs Claude Code CLI via npm (`@anthropic-ai/claude-code@1.0.18`)
   - Configures environment variables for model selection and authentication
   - Provides execution status and output file paths

## Application to Email Classification

### Workflow Design

1. **GitHub Actions Trigger**
   - Cron schedule triggers workflow
   - Workflow prepares environment and authentication

2. **Claude Code Orchestration**
   - Claude Code receives prompt: "Process unread emails for classification"
   - Claude Code calls our CLI tools to:
     - Check for unread emails via `bun run src/cli.ts list-unread`
     - Classify emails using AI reasoning
     - Apply labels via `bun run src/cli.ts label-email <id> <category>`
     - Archive non-critical emails via `bun run src/cli.ts archive-email <id>`

3. **CLI Tool Structure**
   ```typescript
   // src/cli.ts commands
   export async function listUnreadEmails(): Promise<EmailSummary[]>
   export async function classifyEmail(email: EmailSummary): Promise<'needs-response' | 'daily-brief'>
   export async function labelEmail(id: string, label: string): Promise<void>
   export async function archiveEmail(id: string): Promise<void>
   ```

### Benefits of Meta Approach

1. **Natural Language Control**: Claude Code can reason about email content and make classification decisions using natural language understanding
2. **Flexible Tool Usage**: Claude Code can adaptively call different CLI functions based on email content and context
3. **Error Handling**: Claude Code can handle failures gracefully and retry operations with different strategies
4. **Extensibility**: Easy to add new CLI tools without modifying core orchestration logic

### Implementation Patterns

#### Prompt File Strategy
```markdown
# Email Classification Task

You are an AI email assistant. Use the available CLI tools to:

1. Check for unread emails using `bun run src/cli.ts list-unread`
2. For each email, determine if it needs a response or is informational
3. Apply appropriate labels using `bun run src/cli.ts label-email`
4. Archive emails that don't need immediate attention

Email Classification Criteria:
- **Needs Response**: Personal emails, questions, requests, meeting invites requiring action
- **Daily Brief**: Newsletters, notifications, automated reports, FYI emails

Available Tools: Bash, Edit, Write, Read
```

#### CLI Tool Interface
```typescript
// Enhanced CLI with specific commands for Claude Code
export interface EmailSummary {
  id: string;
  subject: string;
  from: string;
  snippet: string;
  date: string;
}

// Command: bun run src/cli.ts list-unread
export async function listUnreadEmails(): Promise<EmailSummary[]>

// Command: bun run src/cli.ts get-email <id>
export async function getEmailContent(id: string): Promise<EmailContent>

// Command: bun run src/cli.ts label-email <id> <label>
export async function labelEmail(id: string, label: string): Promise<void>

// Command: bun run src/cli.ts archive-email <id>
export async function archiveEmail(id: string): Promise<void>
```

## Implementation Steps

### Phase 1: CLI Tool Enhancement
- Add command-line argument parsing to existing CLI
- Break down current functions into discrete commands
- Add JSON output formats for Claude Code consumption
- Test individual CLI commands

### Phase 2: Claude Code Integration
- Create prompt file for email classification task
- Set up GitHub Action using claude-code-base-action pattern
- Configure environment variables and authentication
- Test Claude Code orchestration locally

### Phase 3: Workflow Integration
- Add GitHub Actions workflow for email classification
- Configure cron schedules for regular processing
- Add error handling and logging
- Test end-to-end workflow

## Security Considerations

- Gmail app password and API keys stored as GitHub Secrets
- Claude Code execution isolated in GitHub Actions environment
- No email content persisted beyond processing session
- CLI tools validate input parameters to prevent command injection

## Performance Considerations

- Claude Code adds overhead but provides intelligent decision-making
- Batch processing of emails to minimize API calls
- Efficient JSON communication between Claude Code and CLI tools
- Timeout handling for long-running operations

## Comparison with Direct SDK Integration

| Aspect | Meta Approach (Claude Code Orchestration) | Direct SDK Integration |
|--------|-------------------------------------------|----------------------|
| **Flexibility** | High - natural language reasoning | Limited - programmatic rules |
| **Complexity** | Medium - requires prompt design | Low - direct API calls |
| **Error Handling** | Adaptive - AI can retry/adjust | Manual - explicit error handling |
| **Extensibility** | High - easy to add new tools | Medium - requires code changes |
| **Debugging** | Natural language logs | Code-level debugging |
| **Cost** | Higher - Claude Code execution | Lower - direct API usage |

## MCP Integration Option

### MCP Server Approach

Based on [`claude-code-base-action` MCP documentation](https://github.com/anthropics/claude-code-base-action#using-mcp-config), we can expose our email processing capabilities as structured MCP tools:

#### MCP Configuration
```json
{
  "mcpServers": {
    "email-processor": {
      "command": "bun",
      "args": ["run", "./src/mcp-server.ts"],
      "env": {
        "GMAIL_EMAIL": "${GMAIL_EMAIL}",
        "GMAIL_APP_PASSWORD": "${GMAIL_APP_PASSWORD}"
      }
    }
  }
}
```

#### Tool Exposure
Claude Code would see structured tools like:
- `mcp__email-processor__list_unread_emails`
- `mcp__email-processor__classify_email` 
- `mcp__email-processor__label_email`
- `mcp__email-processor__archive_email`

#### Benefits of MCP Approach
1. **Structured Interface**: Claude Code understands tool parameters and return types
2. **Type Safety**: MCP provides schema validation for tool inputs/outputs
3. **Better Integration**: Native Claude Code tool interface vs. bash command parsing
4. **Error Handling**: Structured error responses vs. parsing CLI output

### Implementation Options Comparison

| Approach | Complexity | Integration | Performance | Showcase Value |
|----------|------------|-------------|-------------|----------------|
| **Direct CLI Calls** | Low | Basic bash commands | Fast | Medium |
| **MCP Server** | Medium | Structured tool interface | Medium | High |
| **Hybrid** | Medium | MCP + fallback CLI | Medium | High |

## Recommendation

**Proceed with MCP Server Approach** for the following reasons:

1. **Native Integration**: Leverages Claude Code's structured tool interface
2. **Professional Implementation**: Demonstrates proper MCP server development
3. **Type Safety**: Structured schemas prevent runtime errors
4. **Extensibility**: Easy to add new email processing tools
5. **Showcase Value**: Highlights advanced Claude Code + MCP integration

The MCP approach provides the best balance of technical sophistication and practical functionality for showcasing AI automation capabilities.