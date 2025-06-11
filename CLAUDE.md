# CLAUDE.md

This file provides guidance to Claude Code (claude.ai/code) when working with code in this repository.

## Project Overview

AI-powered email automation system that processes Gmail emails via Himalaya CLI, categorizes them using Claude Code SDK, and generates daily briefings as GitHub issues. Built with Bun runtime and TypeScript.

## Common Commands

### Development
- `bun run dev` - Run the email checker CLI with live environment loading
- `bun run check-emails` - Same as dev, primary command for email processing
- `bun install` - Install dependencies

### Gmail Testing
- `himalaya -c ./config.toml envelope list` - Test Gmail connection directly
- `himalaya -c ./config.toml account list` - Verify account configuration

### Environment Setup
Required environment variables in `.env.local`:
- `GMAIL_EMAIL` - Gmail address for authentication
- `GMAIL_APP_PASSWORD` - Gmail app password (not regular password)
- `GMAIL_DISPLAY_NAME` - Display name for email configuration

## Architecture

### Email Processing Pipeline
The system implements a two-schedule architecture:

1. **Classification Workflow** (high frequency, every 30 min):
   - Fetches new unread emails via Himalaya CLI
   - Uses Claude Code SDK to categorize emails as "needs response" or "daily brief"
   - Applies Gmail labels and manages inbox state

2. **Briefing Workflow** (low frequency, twice daily):
   - Processes emails labeled "daily-brief"
   - Generates coherent summaries via Claude Code SDK
   - Creates GitHub issues with briefings and Gmail links
   - Updates email labels to "daily-brief-done"

### Key Components

- **src/cli.ts** - Main CLI entry point, handles environment loading and Gmail connection testing
- **config.toml** - Himalaya configuration for Gmail IMAP/SMTP with environment variable authentication
- **specs/email-briefing.md** - Comprehensive feature specification and technical requirements

### External Dependencies

- **Himalaya CLI** - Must be installed system-wide (`brew install himalaya`)
- **Gmail App Password** - Required for authentication (not OAuth in current implementation)
- **Claude Code SDK** - For AI-powered email categorization and briefing generation
- **GitHub API** - For automated issue creation

### Configuration Strategy

The system uses a hybrid configuration approach:
- Environment variables for sensitive data (passwords, API keys)
- TOML config file for Gmail server settings
- Dynamic environment loading in development (`.env.local`)
- GitHub secrets for production deployment

### Deployment Model

Designed for GitHub Actions with two separate workflows:
- High-frequency classification (cron: every 30 minutes)
- Low-frequency briefing generation (cron: 8 AM and 3 PM)

## Development Notes

### Email Configuration
The `config.toml` file is pre-configured for Gmail with specific user details. When adding new users or environments, update the email and display-name fields to match the environment variables.

### Error Handling Pattern
The CLI follows a fail-fast pattern with descriptive error messages for missing environment variables or Gmail connection failures. All Himalaya commands use the `-c ./config.toml` flag to ensure consistent configuration.

### Future Architecture Considerations
The current implementation uses Himalaya CLI as a bridge to Gmail. Future iterations may migrate to direct Gmail API integration for enhanced label management and real-time push notifications.