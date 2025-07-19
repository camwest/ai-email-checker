---
allowed-tools: Bash(himalaya:*), TodoWrite, Write
description: Review and archive emails from personal and work accounts
---

## Context

!`bun run scripts/fetch-emails-for-archive.ts`

## Your Task

Based on the emails above, analyze and create an archiving plan. Look for:
- Read emails older than 30 days
- Promotional/marketing emails
- Automated notifications (GitHub, services, billing)
- Emails that clearly don't require responses

I'll use the TodoWrite tool to create a structured archiving plan for your approval.

After you approve, I'll archive the emails using our archive script:
- Personal: `bun run src/archive-emails.ts {email-ids}`
- Work: `bun run src/archive-emails.ts --account work {email-ids}`

The script handles environment variable loading and uses the correct himalaya syntax:
- `himalaya -c ./config.toml message move '[Gmail]/All Mail' {email-ids}`
- `himalaya -c ./config.toml message move -a work '[Gmail]/All Mail' {email-ids}`

After archiving, create a log file in `logs/archive-YYYY-MM-DD_HH-MM-SS.log` with:
- Timestamp and operation details
- List of archived emails with subjects
- Category breakdown
- Total count per account