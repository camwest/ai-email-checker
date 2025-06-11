# Email Threading Strategy

*Research conducted: June 11, 2025*

## Question
Should our AI email classification system process individual emails separately, or group email threads/conversations together for classification?

## Summary
✅ **Recommend thread-based processing for MVP with graceful fallback to individual emails**. This provides better AI context while matching user expectations, but requires careful handling of edge cases.

## Industry Analysis

### How Email Automation Tools Handle Threading

#### SaneBox (AI Email Management Leader)
**Approach**: **Thread-aware conversation analysis**
- **AI Context**: Analyzes entire conversations for importance patterns
- **Behavioral Learning**: Tracks user interactions across full threads
- **Thread-Aware Features**:
  - `SaneNoReplies`: Tracks sent emails awaiting responses across conversations
  - `SaneReminders`: Sets follow-ups for entire conversation threads
- **Classification**: Makes importance decisions based on conversation context, not individual emails

#### Boomerang (Email Productivity Tool)
**Approach**: **Response tracking with thread continuation**
- **Thread Detection**: Monitors entire conversations for response patterns
- **Smart Follow-ups**: Cancels automated follow-ups if anyone in thread replies
- **Cross-Address Tracking**: Detects replies even from different email addresses within same thread
- **Thread Integrity**: Maintains conversation context across multiple participants

#### Gmail's Native Threading
**Technical Requirements**:
- Groups emails by Subject headers + References/In-Reply-To headers (RFC 2822)
- Supports up to 100 messages per conversation thread
- Breaks threads when subject changes significantly
- Uses Message-ID, In-Reply-To, and References headers for linking

## Threading Approaches Comparison

### 1. Thread-Based Processing (Recommended)

**Implementation Strategy:**
```typescript
interface EmailThread {
  threadId: string;
  messages: EmailMessage[];
  lastMessageDate: Date;
  participants: string[];
  subject: string;
}

async function classifyThread(thread: EmailThread): Promise<ThreadClassification> {
  // Analyze entire conversation context
  const conversationContext = thread.messages.map(msg => ({
    from: msg.from,
    body: msg.body,
    date: msg.date
  }));
  
  // AI classification with full context
  const classification = await claude.classify({
    context: 'email-thread',
    conversation: conversationContext,
    latestMessage: thread.messages[thread.messages.length - 1]
  });
  
  return classification;
}
```

**Advantages:**
- ✅ **Better AI Context**: Full conversation history improves classification accuracy
- ✅ **User Experience**: Matches how users think about email conversations
- ✅ **Avoid Duplication**: Single briefing entry per conversation topic
- ✅ **Intelligent Decisions**: Can detect conversation progression (e.g., FYI → needs response)
- ✅ **Industry Standard**: Follows SaneBox and Boomerang patterns

**Disadvantages:**
- ⚠️ **Complexity**: Need to handle Gmail conversation API and threading logic
- ⚠️ **Mixed Classifications**: Threads with both informational and action-required messages
- ⚠️ **Timing Issues**: New replies can change thread classification
- ⚠️ **Implementation Overhead**: More complex than individual email processing

### 2. Individual Email Processing

**Implementation Strategy:**
```typescript
async function classifyEmail(email: EmailMessage): Promise<EmailClassification> {
  // Analyze single email in isolation
  const classification = await claude.classify({
    context: 'individual-email',
    subject: email.subject,
    body: email.body,
    from: email.from
  });
  
  return classification;
}
```

**Advantages:**
- ✅ **Simple Implementation**: Each email processed independently
- ✅ **Clear Decisions**: No ambiguity about mixed classifications
- ✅ **Easy Debugging**: Straightforward to track and troubleshoot
- ✅ **Himalaya Compatible**: Works naturally with Himalaya's email-by-email approach

**Disadvantages:**
- ❌ **Limited Context**: AI lacks conversation history for decisions
- ❌ **Fragmented Briefings**: Multiple entries for same conversation
- ❌ **Inconsistent Classifications**: Related emails might be classified differently
- ❌ **User Experience**: Doesn't match natural conversation thinking

## Gmail API Threading Support

### Technical Capabilities
```bash
# Himalaya threading support (research needed)
himalaya -c ./config.toml envelope list --thread-id THREAD_ID
himalaya -c ./config.toml message list --thread THREAD_ID
```

### Gmail Conversation Structure
- **Thread ID**: Unique identifier for conversation
- **Message IDs**: Individual emails within thread
- **Threading Headers**: References, In-Reply-To, Message-ID
- **Subject Matching**: Primary threading mechanism

## Recommended Hybrid Approach

### Phase 1: Thread-Based with Individual Fallback

```typescript
async function processEmails(): Promise<void> {
  try {
    // 1. Try to fetch as threads/conversations
    const threads = await getEmailThreads();
    
    for (const thread of threads) {
      await classifyAndProcessThread(thread);
    }
  } catch (error) {
    console.warn('Thread processing failed, falling back to individual emails');
    
    // 2. Fallback to individual email processing
    const emails = await getIndividualEmails();
    
    for (const email of emails) {
      await classifyAndProcessEmail(email);
    }
  }
}

async function classifyAndProcessThread(thread: EmailThread): Promise<void> {
  const classification = await classifyThread(thread);
  
  switch (classification.category) {
    case 'needs-response':
      // Keep entire thread in inbox
      await keepThreadInInbox(thread.threadId);
      break;
      
    case 'daily-brief':
      // Archive thread and label for briefing
      await moveThreadToLabel(thread.threadId, 'ai-email-checker/daily-brief');
      break;
      
    case 'mixed':
      // Handle mixed threads with individual email processing
      await processMixedThread(thread);
      break;
  }
}
```

### Edge Case Handling

#### Mixed Classification Threads
```typescript
async function processMixedThread(thread: EmailThread): Promise<void> {
  // Strategy 1: Use latest message classification for entire thread
  const latestMessage = thread.messages[thread.messages.length - 1];
  const classification = await classifyEmail(latestMessage);
  
  if (classification.category === 'needs-response') {
    // If latest needs response, keep entire thread in inbox
    await keepThreadInInbox(thread.threadId);
  } else {
    // Otherwise, archive with note about mixed content
    await moveThreadToLabel(thread.threadId, 'ai-email-checker/daily-brief');
  }
}
```

#### Thread Update Handling
```typescript
async function handleNewReplyInThread(threadId: string): Promise<void> {
  // When new reply arrives to previously processed thread
  const thread = await getThread(threadId);
  const newClassification = await classifyThread(thread);
  
  // Re-evaluate and potentially move between labels
  if (newClassification.category === 'needs-response') {
    await moveThreadFromBriefToInbox(threadId);
  }
}
```

## Implementation Strategy

### MVP Approach (Phase 1)
**Simplify for initial implementation:**
1. ✅ **Individual Email Processing**: Start simple, get core logic working
2. ✅ **Thread Awareness**: Note thread IDs for future enhancement
3. ✅ **Deduplication**: In briefing generation, group emails by thread ID

### Enhanced Approach (Phase 2) 
**Add thread-based processing:**
1. 🔄 **Full Thread Classification**: Process conversations as units
2. 🔄 **Mixed Thread Handling**: Smart resolution of conflicting classifications
3. 🔄 **Thread Update Logic**: Handle new replies to processed threads

### Implementation with Himalaya

#### Research Complete: Himalaya Threading Support ✅

**Key Findings:**

1. **No Native Thread IDs**: Himalaya envelope list doesn't expose Gmail conversation/thread IDs
2. **IMAP Thread Command Fails**: `himalaya message thread` fails with Gmail (Gmail doesn't support UID THREAD)
3. **Threading Headers Available**: Can extract Message-ID, In-Reply-To, References via `-H` flags
4. **Full Conversation in Body**: Reading a threaded email shows entire conversation history

**Threading Headers Example:**
```bash
himalaya -c ./config.toml message read EMAIL_ID -H Message-ID -H In-Reply-To -H References
```

**Sample Output:**
```
Message-ID: <CAJyZv4uY-iXFnnBGBuz0pifRAxxk9R5=Ri5YvRH-Neoapk0vWA@mail.gmail.com>
In-Reply-To: <CAHcNqP_GsnZCAOPrBLnu8wX6+GnWDRhC4=eeY_EDY3+6PxyLJg@mail.gmail.com>
References: CAHcNqP8ASbNHo=-p=iQx3+LN6gyb0SB6DEJFv8G22-E9H+c-Jw@mail.gmail.com CAPg2OjAnuahUR+sXU7M49e1OZT3ud0cpBE5xs-skx=JP9OYYkQ@mail.gmail.com [... more IDs]
```

#### Actual Thread Processing with Himalaya

**Challenge**: No direct thread grouping, but we can detect threads via subject patterns and header extraction.

```typescript
// Extract threading information from email headers
async function getEmailThreadInfo(emailId: string): Promise<ThreadInfo> {
  const result = await $`himalaya -c ./config.toml message read ${emailId} -H Message-ID -H In-Reply-To -H References --no-headers -o json`;
  
  // Parse headers to extract thread information
  const headers = parseHeadersFromHimalayaOutput(result.stdout.toString());
  
  return {
    messageId: headers['Message-ID'],
    inReplyTo: headers['In-Reply-To'],
    references: headers['References']?.split(/\s+/) || [],
    isThreaded: !!headers['In-Reply-To'] || headers['References']?.length > 0
  };
}

// Group emails by conversation using subject + sender patterns
async function groupEmailsByThread(emails: EmailEnvelope[]): Promise<EmailThread[]> {
  const threadMap = new Map<string, EmailEnvelope[]>();
  
  for (const email of emails) {
    // Create thread key from normalized subject
    const threadKey = normalizeSubject(email.subject);
    
    if (!threadMap.has(threadKey)) {
      threadMap.set(threadKey, []);
    }
    threadMap.get(threadKey)!.push(email);
  }
  
  // Filter out single emails (keep only actual threads)
  return Array.from(threadMap.entries())
    .filter(([_, emails]) => emails.length > 1)
    .map(([threadKey, emails]) => ({
      threadKey,
      emails: emails.sort((a, b) => new Date(a.date).getTime() - new Date(b.date).getTime()),
      latestEmail: emails[emails.length - 1]
    }));
}

// Normalize subject for thread grouping
function normalizeSubject(subject: string): string {
  return subject
    .replace(/^(Re:|Fwd?:|RE:|FW:)\s*/gi, '') // Remove reply/forward prefixes
    .replace(/\s+/g, ' ') // Normalize whitespace
    .trim()
    .toLowerCase();
}
```

**Limitations:**
- No Gmail conversation IDs available through Himalaya
- Must rely on subject-based grouping (less reliable)
- Cannot use Gmail's native threading logic
- Header extraction requires additional API calls per email

## Recommendation

**For MVP: Individual Email Processing with Subject-Based Thread Grouping**

**Rationale:**
1. **Himalaya Limitations**: No native Gmail thread IDs, IMAP thread commands fail
2. **Simple Subject Grouping**: Reliable for basic thread detection (Re:, Fwd: patterns)
3. **Full Context Available**: Threaded emails contain entire conversation in body
4. **Briefing Deduplication**: Can group related emails in summaries

**Implementation Strategy:**

```typescript
// MVP: Individual processing with thread awareness
async function processEmails(): Promise<void> {
  const emails = await getUnreadEmails();
  
  for (const email of emails) {
    // Individual classification but note if it's threaded
    const isThreaded = email.subject.match(/^(Re:|Fwd?:|RE:|FW:)/i);
    const threadKey = normalizeSubject(email.subject);
    
    const classification = await classifyEmail(email, { 
      isThreaded, 
      threadKey,
      hasFullContext: isThreaded // Threaded emails contain full conversation
    });
    
    await processEmailWithThreadInfo(email, classification, threadKey);
  }
}

// In briefing generation, group by thread key
async function generateBriefing(): Promise<void> {
  const emails = await getProcessedEmails();
  const groupedByThread = groupBy(emails, 'threadKey');
  
  // Create conversation summaries instead of individual email summaries
  for (const [threadKey, threadEmails] of groupedByThread) {
    if (threadEmails.length > 1) {
      await createConversationSummary(threadKey, threadEmails);
    } else {
      await createIndividualEmailSummary(threadEmails[0]);
    }
  }
}
```

**Benefits:**
- 🚀 **Works with Himalaya**: Uses available capabilities, no Gmail API needed
- 🧵 **Thread-Aware**: Groups related emails for better briefings
- 📖 **Full Context**: Leverages fact that threaded emails contain full conversation
- 🔄 **Future-Ready**: Can upgrade to Gmail API threading later if needed

**Limitations:**
- Subject-based grouping less accurate than Gmail's native threading
- No access to Gmail conversation IDs
- Must handle threading logic manually

**Migration Path:**
1. ✅ **MVP**: Subject-based thread grouping with individual email processing
2. 🔄 **Phase 2**: Add Gmail API for native conversation threading (if needed)
3. 🚀 **Phase 3**: Full conversation-based classification

This approach maximizes what's possible with Himalaya while providing meaningful thread awareness for better user experience.