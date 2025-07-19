---
allowed-tools: Bash(himalaya:*), TodoWrite
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

After you approve, I'll execute commands like:
- `himalaya -c ./config.toml envelope move {email-ids} '[Gmail]/All Mail'`
- `himalaya -c ./config.toml -a work envelope move {email-ids} '[Gmail]/All Mail'`