# Gmail Push Notifications Research

*Research conducted: June 11, 2025*

## Question
Can we use Gmail API webhooks for real-time email classification instead of polling every 30 minutes?

## Summary
✅ **Yes, Gmail supports real-time push notifications via Google Cloud Pub/Sub**, but the complexity and infrastructure requirements make polling a better choice for our MVP.

## Technical Overview

### How Gmail Push Notifications Work
Gmail API integrates with Google Cloud Pub/Sub to deliver real-time notifications when mailbox changes occur. When new emails arrive, Gmail publishes a message to your configured Pub/Sub topic, which can trigger webhooks or be pulled by your application.

### Setup Requirements

#### Infrastructure
- **Google Cloud Platform Project**: Required for Pub/Sub service
- **Cloud Pub/Sub Topic**: Receives Gmail notifications
- **Pub/Sub Subscription**: Routes messages to your webhook
- **Webhook Endpoint**: Publicly accessible URL to receive notifications
- **Domain Verification**: DNS confirmation for webhook domain

#### Authentication & Permissions
- **OAuth 2.0 Credentials**: More complex than app passwords
- **Gmail API Scopes Required**:
  - `https://mail.google.com/`
  - `https://www.googleapis.com/auth/gmail.modify`
  - `https://www.googleapis.com/auth/gmail.readonly`
- **Service Account Permissions**: Grant `gmail-api-push@system.gserviceaccount.com` publisher role

#### Code Implementation
```javascript
// Example watch setup
async function setupGmailWatch(auth) {
    const gmail = google.gmail({ version: 'v1', auth });
    const res = await gmail.users.watch({
        userId: 'me',
        requestBody: {
            'labelIds': ['INBOX'],
            topicName: 'projects/your-project/topics/gmail-notifications'
        },
    });
}
```

### Webhook Payload Format
```json
{
  "message": {
    "data": "base64-encoded-payload",
    "messageId": "unique-message-id"
  }
}
```

Decoded payload contains:
- Email address
- History ID (used to fetch actual email details)

## Trade-off Analysis

### Push Notifications Advantages
- ⚡ **True Real-time**: Instant notification vs 30-minute delays
- 🔋 **Efficient**: No unnecessary API calls when no emails arrive
- 📊 **Scalable**: Better for high-volume email processing
- 🎯 **Precise**: Only triggers when actual changes occur

### Push Notifications Disadvantages
- 🏗️ **Complex Setup**: Requires GCP project, Pub/Sub, domain verification
- 💰 **Additional Costs**: 
  - Pub/Sub messaging fees (~$0.40 per million messages)
  - Hosting costs for webhook endpoint
- 🔄 **Maintenance Overhead**: 
  - Watch expires every 7 days, requires renewal
  - Token management and refresh
- 🔐 **Authentication Complexity**: OAuth 2.0 vs simple app passwords
- 🌐 **Infrastructure Requirements**: Need publicly accessible webhook endpoint
- 📈 **Learning Curve**: More complex than current Himalaya CLI approach

### Current Polling Approach Advantages
- ✅ **Simple Setup**: Already working with Himalaya CLI + app passwords
- 💵 **No Additional Costs**: Uses existing Gmail access
- 🛠️ **Minimal Infrastructure**: Runs in GitHub Actions, no external hosting
- 🔧 **Easy Maintenance**: No token refresh or watch renewal
- 📚 **Known Approach**: Team already understands implementation

### Current Polling Approach Disadvantages
- ⏰ **30-minute Delays**: Not truly real-time
- 🔄 **Unnecessary API Calls**: Polls even when no new emails
- 📊 **Less Efficient**: Higher API usage for busy periods

## Cost Analysis

### Push Notifications Costs
- **Pub/Sub**: ~$0.40 per million messages
- **Cloud Functions/App Engine**: ~$0.20-0.40 per million invocations
- **Estimated Monthly Cost**: $5-15 for moderate email volume (1000 emails/month)

### Polling Costs
- **GitHub Actions**: Included in free tier for public repos
- **Gmail API**: Free quota sufficient for moderate use
- **Estimated Monthly Cost**: $0

## Implementation Complexity

### Push Notifications Implementation
```
Complexity: HIGH
Timeline: 2-3 weeks
Components:
- GCP project setup
- Pub/Sub configuration
- OAuth authentication flow
- Webhook endpoint development
- Domain verification
- Error handling & retry logic
- Weekly watch renewal system
```

### Current Polling Implementation  
```
Complexity: LOW
Timeline: 1-2 days
Components:
- Enhance current CLI to handle labels
- Add basic error handling
- Update GitHub Actions workflow
```

## Recommendation

### For MVP: Continue with Polling Approach
**Rationale:**
- 30-minute response time is acceptable for most email workflows
- Significantly simpler implementation
- Zero additional infrastructure costs
- Can iterate and improve core email classification logic first
- Can always upgrade to push notifications later

### Future Consideration: Push Notifications
**When to Consider:**
- Processing >500 emails/day where real-time matters
- User feedback indicates 30-minute delay is problematic
- Infrastructure team available to manage GCP complexity
- Budget allows for additional hosting/service costs

## Technical Implementation Notes

### Migration Path
If we later decide to implement push notifications:
1. Keep current Himalaya CLI for email reading/manipulation
2. Add Gmail API for push notification setup only
3. Hybrid approach: push triggers immediate polling
4. Gradual migration without breaking existing functionality

### Alternative: Hybrid Approach
- Use push notifications to trigger immediate classification runs
- Keep Himalaya CLI for actual email processing
- Best of both worlds: real-time triggers + simple email handling

## References
- [Gmail API Push Notifications Guide](https://developers.google.com/gmail/api/guides/push)
- [Google Cloud Pub/Sub Pricing](https://cloud.google.com/pubsub/pricing)
- [Gmail API Webhook Implementation Example](https://livefiredev.com/step-by-step-gmail-api-webhook-to-monitor-emails-node-js/)
- [GitHub Gist: Gmail Push Implementation](https://gist.github.com/tablekat/09a00b741c14aca51d18c738070cc545)

## Decision
**Proceed with 30-minute polling for MVP**. Revisit push notifications after core email classification functionality is proven and stable.