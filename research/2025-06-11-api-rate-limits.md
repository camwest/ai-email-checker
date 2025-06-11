# API Rate Limits Analysis

*Research conducted: June 11, 2025*

## Question
What API rate limits do we need to worry about for our email automation system? Is 30-minute polling safe from rate limits?

## Summary
✅ **30-minute polling is extremely conservative and nowhere near any rate limits**. Even aggressive 1-minute polling would be safe for moderate email volumes.

## API Limits by Service

### Gmail API (via Himalaya CLI)
**Daily Limits:**
- 1,000,000,000 quota units per day per project (1 billion)
- Dynamic daily limits based on usage patterns

**Per-Second Limits:**
- 250 quota units per user per second (moving average)
- Allows short bursts above limit

**Quota Unit Costs (examples):**
- `messages.list`: 1-5 quota units
- `messages.get`: 5 quota units  
- `messages.modify`: 5 quota units (for labeling)
- `labels.list`: 1 quota unit

### Claude API (Anthropic)
**Free Tier:**
- 5 requests/minute
- 20,000 tokens/minute
- 300,000 tokens/day

**Paid Tier 1:**
- 50 requests/minute
- Higher token limits

**Paid Higher Tiers:**
- Up to 80,000 input tokens/minute
- Custom limits available

### GitHub API
**General Limits:**
- 5,000 requests/hour (authenticated)
- 15,000 requests/hour (enterprise accounts)

**Content Creation (Issues):**
- 500 requests/hour
- 80 requests/minute

## Rate Limit Analysis for Our Use Case

### Classification Schedule (Every 30 Minutes)

**Gmail API Usage:**
```
Frequency: 2 requests/hour (every 30 min)
Daily total: 48 requests/day
Quota consumption: ~240 units/day (5 units × 48 requests)

Compared to limits:
- Daily: 240 / 1,000,000,000 = 0.000024% of limit
- Per-second: 240 / (250 × 86,400) = 0.0000011% of limit
```

**Claude API Usage (Classification):**
```
Frequency: Depends on email volume
Estimate: 50 emails/day × 2 classification runs = 100 requests/day
Token usage: ~1,000 tokens per email = 100,000 tokens/day

Compared to limits (Paid Tier 1):
- Requests: 100 / (50 × 60 × 24) = 0.14% of daily capacity
- Tokens: 100,000 / 300,000 = 33% of free tier daily limit
```

### Briefing Schedule (Twice Daily)

**GitHub API Usage:**
```
Frequency: 2 issues/day maximum
Annual total: 730 issues/year

Compared to limits:
- Hourly: 2 / 500 = 0.4% of content creation limit
- Daily: 2 / (500 × 24) = 0.017% of daily capacity
```

**Claude API Usage (Briefing Generation):**
```
Frequency: 2 requests/day
Token usage: ~5,000 tokens per briefing = 10,000 tokens/day

Compared to limits:
- Requests: 2 / (50 × 60 × 24) = 0.003% of daily capacity
- Tokens: 10,000 / 300,000 = 3.3% of free tier daily limit
```

## Safety Margins

### Current 30-Minute Polling
- **Gmail API**: Using 0.000024% of quota (extremely safe)
- **Claude API**: Using ~36% of free tier tokens (comfortable for paid tier)
- **GitHub API**: Using 0.4% of content limits (extremely safe)

### Aggressive 1-Minute Polling (Theoretical)
```
Gmail requests: 1,440/day (safe - still <0.01% of limits)
Claude requests: 3,000/day (would need paid tier)
GitHub issues: Still 2/day (unchanged)
```

### High Email Volume (500 emails/day)
```
Gmail API: Still well under limits
Claude API: ~500,000 tokens/day (needs paid tier)
GitHub API: Still 2 issues/day (unchanged)
```

## Bottleneck Analysis

**Most Restrictive Limits (in order):**
1. **Claude API Tokens** (free tier: 300k/day, paid: much higher)
2. **GitHub Content Creation** (500 issues/hour, not a real concern)
3. **Gmail API** (essentially unlimited for our use case)

## Recommendations

### For MVP (Current Plan)
- ✅ **30-minute polling**: Extremely conservative, zero risk
- ✅ **Free Claude tier**: Sufficient for moderate email volume
- ✅ **GitHub free tier**: More than adequate

### Scaling Considerations
- **100+ emails/day**: Consider Claude paid tier ($20/month)
- **500+ emails/day**: Definitely need Claude paid tier
- **1000+ emails/day**: May need higher Claude tier

### Monitoring Strategy
```javascript
// Add to CLI for monitoring
console.log(`Daily email volume: ${emailCount}`);
console.log(`Claude tokens used: ${tokenCount}`);
console.log(`Estimated monthly cost: $${estimatedCost}`);
```

## Rate Limit Handling

### Error Responses to Handle
- **Gmail**: HTTP 403/429 → Exponential backoff
- **Claude**: HTTP 429 → Check retry-after header
- **GitHub**: HTTP 403 → Check rate limit headers

### Retry Strategy
```javascript
// Exponential backoff example
const delay = Math.min(1000 * Math.pow(2, retryCount), 30000);
await new Promise(resolve => setTimeout(resolve, delay));
```

## Conclusion

**30-minute polling is overkill from a rate limit perspective**. Even 5-minute polling would be safe for moderate email volumes. The bottleneck will be Claude API tokens, not request frequency.

**Optimal frequency recommendation**: 
- **Start**: 30 minutes (proven safe)
- **Optimize**: 10-15 minutes after MVP proven
- **Scale**: Consider push notifications only for >500 emails/day

Rate limits are not a concern for this project at any reasonable scale.