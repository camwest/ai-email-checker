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
- **Format**: GitHub issue created in repository
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
- **Issue Creation**: Automated via GitHub API
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
- GitHub token for issue creation
- No email content stored permanently

### Error Handling
- Failed email processing should not block entire workflow
- Network timeouts should retry with backoff
- Malformed emails should be logged and skipped
- AI service failures should fallback to simple categorization

## Questions for Implementation
1. **Gmail Push Notifications**: Can we use Gmail API webhooks for real-time classification?
2. **Classification Frequency**: What's the optimal balance between responsiveness and API limits?
3. **Gmail Label Management**: How to handle existing labels vs. creating new ones?
4. **Email Threading**: Should replies be grouped with original emails?
5. **Attachment Handling**: How to reference emails with attachments in briefings?
6. **Rate Limiting**: How to handle Gmail/Claude API limits across two schedules?
7. **Timezone Handling**: User timezone for schedule configuration?
8. **State Management**: How to track which emails have been processed between runs?