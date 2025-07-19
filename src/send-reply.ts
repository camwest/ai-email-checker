#!/usr/bin/env bun

import { $ } from "bun";
import { readFile } from "fs/promises";

// Verify environment variables are loaded
const requiredEnvVars = ['GMAIL_EMAIL', 'GMAIL_APP_PASSWORD', 'GMAIL_DISPLAY_NAME'];
for (const varName of requiredEnvVars) {
  if (!process.env[varName]) {
    console.error(`❌ Missing required environment variable: ${varName}`);
    process.exit(1);
  }
}

// Get arguments
const args = process.argv.slice(2);
const replyToId = args[0];
const draftFile = args[1];

if (!replyToId || !draftFile) {
  console.error('❌ Missing required arguments');
  console.log('Usage: bun run src/send-reply.ts <email-id> <draft-file>');
  console.log('Example: bun run src/send-reply.ts 167307 draft-reply.txt');
  process.exit(1);
}

try {
  // Read the draft content
  const draftContent = await readFile(draftFile, 'utf-8');
  
  console.log(`📧 Creating reply to email ${replyToId}...`);
  
  // Get minimal headers from original email
  const originalEmail = await $`himalaya -c ./config.toml message read ${replyToId}`.text();
  
  // Extract just the From and Subject from the text output
  const fromMatch = originalEmail.match(/From: (.+)/);
  const subjectMatch = originalEmail.match(/Subject: (.+)/);
  
  if (!fromMatch || !subjectMatch) {
    throw new Error('Could not extract required headers');
  }
  
  const replyTo = fromMatch[1];
  const originalSubject = subjectMatch[1];
  const replySubject = originalSubject.startsWith('RE: ') ? originalSubject : `RE: ${originalSubject}`;
  
  // Create a simple plain text email
  const myEmail = process.env.GMAIL_EMAIL;
  const myName = process.env.GMAIL_DISPLAY_NAME;
  
  const rawMessage = `From: ${myName} <${myEmail}>
To: ${replyTo}
Subject: ${replySubject}

${draftContent}`;

  console.log('\n📝 Message preview:');
  console.log('─'.repeat(60));
  console.log(rawMessage);
  console.log('─'.repeat(60));
  
  // Save as draft first
  console.log('\n💾 Saving to drafts...');
  
  const tempFile = `/tmp/himalaya-reply-${Date.now()}.eml`;
  await Bun.write(tempFile, rawMessage);
  
  try {
    const result = await $`himalaya -c ./config.toml message save -f "[Gmail]/Drafts" < ${tempFile}`.quiet();
    
    if (result.exitCode === 0) {
      console.log('✅ Draft saved successfully!');
      console.log('📱 Open Gmail to review and send your draft');
    } else {
      console.error('❌ Failed to save draft:', result.stderr.toString());
    }
  } finally {
    // Clean up temp file
    await $`rm -f ${tempFile}`.quiet();
  }
  
} catch (error) {
  console.error('❌ Error:', error);
  process.exit(1);
}