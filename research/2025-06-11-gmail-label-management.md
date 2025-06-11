# Gmail Label Management Strategy

*Research conducted: June 11, 2025*

## Question
How should we handle Gmail label management? Should we use find-or-create for app-specific labels, or external persistence like Supabase?

## Summary
✅ **Find-or-create approach for app-specific labels is the industry standard and recommended approach** for our MVP. External persistence adds unnecessary complexity without significant benefits.

## Industry Analysis

### How Other Email Automation Tools Handle Labels

#### SaneBox (Leading Email AI Tool)
- **Approach**: Creates app-specific labels/folders with clear prefixes
- **Labels Created**:
  - `@SaneLater` - Less important emails
  - `@SaneNews` - Newsletter consolidation  
  - `@SaneBlackHole` - Auto-delete and unsubscribe
- **Strategy**: Proactive label creation with descriptive, branded naming

#### Gmail Filters & Rules
- **Approach**: Auto-create labels when filters are applied
- **Pattern**: Create label if it doesn't exist during filter execution
- **Best Practice**: Hierarchical organization with parent/child labels

#### Zapier & Automation Tools
- **Challenge**: No built-in "create if doesn't exist" in Gmail API
- **Solution**: Developers implement find-or-create pattern manually
- **Standard Practice**: List existing labels, then create missing ones

## Technical Approaches Comparison

### 1. Find-or-Create Labels (Recommended)

**Implementation Pattern:**
```typescript
async function ensureLabel(labelName: string): Promise<string> {
  // 1. List existing labels
  const existingLabels = await gmail.users.labels.list({ userId: 'me' });
  
  // 2. Check if label exists
  const existing = existingLabels.data.labels?.find(
    label => label.name === labelName
  );
  
  if (existing) {
    return existing.id!;
  }
  
  // 3. Create label if missing
  const newLabel = await gmail.users.labels.create({
    userId: 'me',
    requestBody: {
      name: labelName,
      labelListVisibility: 'labelShow',
      messageListVisibility: 'show'
    }
  });
  
  return newLabel.data.id!;
}
```

**Advantages:**
- ✅ **Industry Standard**: Used by SaneBox, Zapier, most email tools
- ✅ **Simple**: No external dependencies
- ✅ **Resilient**: Handles user deletion of labels
- ✅ **Native**: Leverages Gmail's built-in organization
- ✅ **Cost**: $0 additional infrastructure
- ✅ **Idempotent**: Safe to run multiple times

**Disadvantages:**
- ⚠️ **Slightly Complex**: Need to implement find-or-create logic
- ⚠️ **API Calls**: Extra calls to list/create labels (minimal cost)

### 2. External Persistence (Supabase/Database)

**Implementation Pattern:**
```typescript
// Track email processing state externally
interface EmailProcessingState {
  emailId: string;
  status: 'needs-response' | 'daily-brief' | 'daily-brief-done';
  processedAt: Date;
  briefingIssueId?: number;
}
```

**Advantages:**
- ✅ **Full Control**: Complete control over data structure
- ✅ **Rich Metadata**: Can track additional processing details
- ✅ **Queries**: Complex filtering and reporting possible

**Disadvantages:**
- ❌ **Complexity**: Additional service dependency
- ❌ **Cost**: Supabase hosting costs (~$25/month)
- ❌ **Sync Issues**: Need to keep Gmail and DB in sync
- ❌ **Failure Points**: Another service that can fail
- ❌ **Migration**: Users can't see organization in Gmail natively

## Recommended Label Strategy

### Label Naming Convention
Following SaneBox's approach with clear app prefixes:

```
ai-email-checker/daily-brief
ai-email-checker/daily-brief-done
ai-email-checker/needs-response (optional)
```

**Rationale:**
- **Namespace**: Prevents conflicts with user labels
- **Descriptive**: Clear purpose for each label
- **Hierarchical**: Could add sub-categories later
- **Brandable**: Easy to identify our system's labels

### Implementation Strategy

#### Phase 1: Core Labels (MVP)
```typescript
const REQUIRED_LABELS = [
  'ai-email-checker/daily-brief',
  'ai-email-checker/daily-brief-done'
];

// Note: 'needs-response' emails stay in inbox unlabeled
```

#### Phase 2: Enhanced Labels (Future)
```typescript
const ENHANCED_LABELS = [
  'ai-email-checker/daily-brief/work',
  'ai-email-checker/daily-brief/personal', 
  'ai-email-checker/daily-brief/newsletters',
  'ai-email-checker/error/classification-failed'
];
```

### Error Handling Strategy

#### Graceful Degradation
```typescript
async function applyLabel(emailId: string, labelName: string) {
  try {
    const labelId = await ensureLabel(labelName);
    await gmail.users.messages.modify({
      userId: 'me',
      id: emailId,
      requestBody: {
        addLabelIds: [labelId]
      }
    });
  } catch (error) {
    // Log but don't fail entire workflow
    console.warn(`Failed to apply label ${labelName} to ${emailId}:`, error);
    
    // Continue processing other emails
    await trackErrorExternally(emailId, 'label-application-failed');
  }
}
```

## Alternative: Hybrid Approach

For maximum resilience, combine both approaches:

```typescript
// Primary: Use Gmail labels for user visibility
await applyLabel(emailId, 'ai-email-checker/daily-brief');

// Secondary: Track in external DB for recovery/reporting
await trackProcessingState({
  emailId,
  status: 'daily-brief',
  processedAt: new Date(),
  labelApplied: true
});
```

**Benefits:**
- Gmail labels for user experience
- External tracking for system reliability
- Easy recovery from label deletion
- Rich analytics and reporting

## Gmail API Technical Details

### Label Limits & Constraints
- **Maximum**: 10,000 labels per user (not a concern)
- **System Labels**: Reserved names (INBOX, SENT, etc.)
- **Hierarchy**: Support nested labels with `/` separator
- **Visibility**: Control label and message list visibility

### Required Permissions
```
https://www.googleapis.com/auth/gmail.labels
https://www.googleapis.com/auth/gmail.modify
```

### Performance Considerations
- **List Labels**: ~1 quota unit (very cheap)
- **Create Label**: ~5 quota units (one-time cost)
- **Apply Label**: ~5 quota units per email

## Himalaya CLI Label Management

### Key Discovery: Himalaya Supports Gmail Labels! ✅

**Gmail labels are exposed as IMAP folders in Himalaya:**

```bash
# List all labels/folders (including Gmail labels)
himalaya -c ./config.toml folder list

# Create a new label/folder  
himalaya -c ./config.toml folder add "ai-email-checker/daily-brief"

# Delete a label/folder
himalaya -c ./config.toml folder delete "ai-email-checker/daily-brief"
```

**Authentication:** Same app password works for both email reading AND label management - no need for Gmail API OAuth complexity!

**Benefits of Using Himalaya for Labels:**
- ✅ **Consistent Auth**: Same app password for everything
- ✅ **No Gmail API**: Avoid OAuth complexity and additional dependencies  
- ✅ **Unified Tool**: One CLI for all email operations
- ✅ **IMAP Standard**: Works with any IMAP provider, not just Gmail
- ✅ **Simple**: Straightforward folder commands

### Himalaya Label Operations

```typescript
// Find-or-create pattern with Himalaya CLI
async function ensureLabelExists(labelName: string): Promise<void> {
  try {
    // List existing folders/labels
    const result = await $`himalaya -c ./config.toml folder list -o json`;
    const folders = JSON.parse(result.stdout.toString());
    
    // Check if label exists
    const labelExists = folders.some((folder: any) => folder.name === labelName);
    
    if (!labelExists) {
      // Create label if it doesn't exist
      await $`himalaya -c ./config.toml folder add "${labelName}"`;
      console.log(`Created label: ${labelName}`);
    }
  } catch (error) {
    console.warn(`Failed to ensure label ${labelName}:`, error);
  }
}

// Apply label to email (and archive from inbox)
async function applyLabel(emailId: string, labelName: string): Promise<void> {
  try {
    // Move message to folder (applies Gmail label + archives from inbox)
    await $`himalaya -c ./config.toml message move ${emailId} "${labelName}"`;
  } catch (error) {
    console.warn(`Failed to apply label ${labelName} to ${emailId}:`, error);
  }
}

// Alternative: Copy to apply label without removing from inbox
async function applyLabelKeepInInbox(emailId: string, labelName: string): Promise<void> {
  try {
    // Copy message to folder (applies Gmail label, keeps in inbox)
    await $`himalaya -c ./config.toml message copy ${emailId} "${labelName}"`;
  } catch (error) {
    console.warn(`Failed to copy to label ${labelName} for ${emailId}:`, error);
  }
}
```

## Recommendation

**For MVP: Use Himalaya CLI with Find-or-Create Label Strategy**

**Rationale:**
1. **Himalaya Native**: Use existing CLI tool, no Gmail API needed
2. **Same Authentication**: App password works for labels too
3. **Simple Implementation**: Folder commands are straightforward
4. **Cost Effective**: $0 additional infrastructure  
5. **IMAP Standard**: Portable to other email providers
6. **Unified Tooling**: One CLI for all email operations

**Implementation Priority:**
1. ✅ Use Himalaya folder commands for find-or-create pattern
2. 🔄 Add error handling for folder operations
3. 🚀 Consider message move/copy operations for labeling

**Labels for MVP (Himalaya folder commands):**
- `ai-email-checker/daily-brief` - Emails ready for briefing
- `ai-email-checker/daily-brief-done` - Emails included in briefings

**Sample Implementation:**
```bash
# Setup labels on first run
himalaya -c ./config.toml folder add "ai-email-checker/daily-brief"
himalaya -c ./config.toml folder add "ai-email-checker/daily-brief-done"

# Apply labels during classification  
himalaya -c ./config.toml message move EMAIL_ID "ai-email-checker/daily-brief"  # Archives from inbox
himalaya -c ./config.toml message copy EMAIL_ID "ai-email-checker/daily-brief"  # Keeps in inbox
```

This approach leverages our existing Himalaya setup without adding Gmail API complexity.