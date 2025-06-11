# Email Briefing Feature

## Overview

An automated email processing system that runs twice daily via GitHub Actions to categorize emails using AI, keep important emails in the inbox for manual review, and generate digestible briefings of non-critical emails as GitHub issues.

## User Story

**As a busy professional, I want an AI assistant to automatically process my emails twice daily so that I can focus on emails requiring responses while staying informed about everything else through concise briefings.**

## Core Requirements

### 1. Automated Email Processing (Two-Schedule System)

#### Schedule 1: Email Classification (High Frequency)
- **Frequency**: Every 30 minutes (configurable, or push-based if possible)
- **Purpose**: Immediate email categorization and inbox management
- **Platform**: GitHub Actions workflow  
- **Email Source**: Gmail via Himalaya CLI
- **Processing Scope**: New unread emails in inbox since last run

#### Schedule 2: Briefing Generation (Low Frequency)  
- **Frequency**: Twice daily at configurable times (default: 8 AM and 3 PM)
- **Purpose**: Generate and deliver email briefings
- **Platform**: GitHub Actions workflow
- **Processing Scope**: All emails tagged with "daily-brief" label

### 2. AI-Powered Email Categorization
- **Decision Engine**: Claude Code SDK integration
- **Categories**:
  - **Needs Response**: Emails requiring human attention/action
  - **Daily Brief**: Informational emails for awareness only

### 3. Email Actions Based on Category

#### Emails Needing Response
- **Location**: Remain in Gmail inbox
- **Status**: Keep as unread
- **Purpose**: Ensures immediate visibility for manual handling

#### Daily Brief Emails  
- **Tagging**: Apply "daily-brief" Gmail label
- **Location**: Move out of inbox (archive)
- **Processing**: Include in next briefing generation

### 4. Briefing Generation & Delivery
- **Format**: GitHub issue created in private repository
- **Target Repository**: `camwest/ai-email-briefings` (private repo for privacy)
- **Content**: 
  - Coherent summary of all "daily-brief" emails
  - Direct links to original emails in Gmail
  - Organized by relevance/topic when possible
- **Recipient**: @camwest (configurable)
- **Post-Processing**: Change email labels from "daily-brief" to "daily-brief-done"

### 5. User Workflow
1. Receive GitHub notification for new briefing issue
2. Review briefing summary in GitHub issue
3. Click Gmail links for emails requiring more detail
4. Close GitHub issue when finished reading
5. Handle response-required emails directly in Gmail inbox

## Technical Requirements

### Gmail Integration
- **Authentication**: App password via environment variables
- **Operations Required**:
  - Read emails from inbox
  - Apply/modify labels
  - Archive emails (move out of inbox)
  - Generate Gmail web links

### AI Integration
- **Primary**: Claude Code SDK for email categorization
- **Secondary**: Claude Code SDK for briefing generation
- **Prompts Needed**:
  - Email classification prompt
  - Briefing summarization prompt

### GitHub Integration
- **Issue Creation**: Automated via GitHub API to private repository
- **Repository Separation**: 
  - Code repository: `camwest/ai-email-checker` (public - for open source showcase)
  - Briefings repository: `camwest/ai-email-briefings` (private - for privacy)
- **Authentication**: Personal Access Token with repo scope for private repository
- **Content**: Markdown-formatted briefings
- **Mentions**: Configurable user tags

### Configuration
- **Classification Schedule**: Configurable frequency (default: every 30 min)
- **Briefing Schedule**: Configurable run times (default: 8 AM & 3 PM)
- **Recipients**: Configurable GitHub usernames to tag
- **Gmail Labels**: Configurable label names
- **Push Notifications**: Optional Gmail push notifications (if supported)

## Success Criteria

### MVP Success Metrics
- [ ] GitHub Actions runs successfully twice daily
- [ ] All inbox emails are processed and categorized  
- [ ] Emails needing response remain in inbox as unread
- [ ] Non-critical emails are moved to "daily-brief" label
- [ ] GitHub issue is created with coherent briefing
- [ ] Gmail links in briefing work correctly
- [ ] Processed emails are marked as "daily-brief-done"

### User Experience Goals
- **Inbox Zero**: Only response-required emails remain in inbox
- **Time Savings**: No manual email sorting required
- **Context Preservation**: Easy access to original emails via links
- **Awareness Maintained**: Stay informed without inbox clutter

## Future Enhancements (Out of Scope for MVP)
- Draft response generation for "needs response" emails
- Smart briefing categorization (work, personal, bills, etc.)
- Email sentiment analysis
- Integration with other email providers
- Custom AI prompts per user
- Email thread handling
- Briefing format customization

## Technical Architecture Notes

### Data Flow

#### Classification Workflow (High Frequency)
1. **Trigger**: GitHub Actions cron schedule (every 30 min)
2. **Fetch**: Himalaya CLI retrieves new unread emails  
3. **Analyze**: Claude Code SDK categorizes each email
4. **Process**: Apply labels and archive based on category
   - Needs response: Keep in inbox, mark unread
   - Daily brief: Apply "daily-brief" label, archive

#### Briefing Workflow (Twice Daily)
1. **Trigger**: GitHub Actions cron schedule (8 AM & 3 PM)
2. **Fetch**: Find all emails with "daily-brief" label
3. **Generate**: Claude Code SDK creates coherent briefing summary
4. **Deliver**: GitHub API creates issue with briefing and Gmail links
5. **Cleanup**: Update labels from "daily-brief" to "daily-brief-done"

### Security Considerations
- Gmail app password stored as GitHub secret
- Claude API key stored as GitHub secret
- Personal Access Token for private repository stored as GitHub secret
- No email content stored permanently
- Email briefings stored in private repository only

### Error Handling
- Failed email processing should not block entire workflow
- Network timeouts should retry with backoff
- Malformed emails should be logged and skipped
- AI service failures should fallback to simple categorization

## Implementation Decisions

### Research-Based Technical Decisions

1. **Gmail Push Notifications** ✅ **DECISION: Use 30-minute polling for MVP**
   - Research: [Gmail Push Notifications](research/2025-06-11-gmail-push-notifications.md)
   - **Rationale**: Push notifications require complex GCP infrastructure, OAuth complexity, and weekly maintenance. 30-minute polling is simpler, costs $0, and sufficient for email workflows.

2. **Classification Frequency** ✅ **DECISION: 30-minute polling is extremely conservative**
   - Research: [API Rate Limits Analysis](research/2025-06-11-api-rate-limits.md)
   - **Rationale**: Using only 0.000024% of Gmail quota. Even 1-minute polling would be safe. API limits are not a constraint for this project.

3. **Gmail Label Management** ✅ **DECISION: Use Himalaya folder commands with find-or-create pattern**
   - Research: [Gmail Label Management Strategy](research/2025-06-11-gmail-label-management.md)
   - **Rationale**: Himalaya can manage Gmail labels via folder commands using same app password auth. No Gmail API complexity needed.

4. **Email Threading** ✅ **DECISION: Individual email processing with subject-based thread grouping**
   - Research: [Email Threading Strategy](research/2025-06-11-email-threading-strategy.md)
   - **Rationale**: Himalaya doesn't support Gmail native threading, but threaded emails contain full conversation context. Group by normalized subject in briefings.

5. **Attachment Handling** ✅ **DECISION: Ignore attachments for MVP**
   - Research: [Attachment Handling Strategy](research/2025-06-11-attachment-handling-strategy.md)
   - **Rationale**: Attachment processing adds complexity, security risks, and performance costs. Users can access attachments via Gmail links in briefings.

6. **Rate Limiting** ✅ **DECISION: Not a concern**
   - Reference: [API Rate Limits Analysis](research/2025-06-11-api-rate-limits.md)
   - **Rationale**: 30-minute polling uses negligible API quota. Rate limiting is not a constraint for any reasonable email volume.

7. **Timezone Handling** ✅ **DECISION: Use UTC/CRON for MVP, user timezones later**
   - **Rationale**: GitHub Actions uses UTC by default. Simple cron expressions like `0 8,15 * * *` for 8 AM and 3 PM UTC. Future enhancement: user timezone configuration.

8. **State Management** ✅ **DECISION: Gmail labels are our state management**
   - Reference: [Gmail Label Management Strategy](research/2025-06-11-gmail-label-management.md)
   - **Rationale**: Labels provide natural state tracking. `daily-brief` = ready for briefing, `daily-brief-done` = already processed. No external database needed.

### Architecture Decisions

9. **Repository Strategy** ✅ **DECISION: Public code repository with private briefings repository**
   - **Rationale**: Enables open source showcase while maintaining privacy. Public repo (`ai-email-checker`) contains code, specs, and documentation. Private repo (`ai-email-briefings`) contains actual email briefings via GitHub issues.
   - **Implementation**: GitHub Actions in public repo creates issues in private repo using Personal Access Token.
   - **Benefits**: Open source portfolio value + private email data + familiar GitHub issues workflow.