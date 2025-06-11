#!/usr/bin/env bun

import { $ } from "bun";
import { join } from "path";

// Load environment variables from .env.local if it exists
const envFile = join(import.meta.dir, "../.env.local");
try {
  const env = await Bun.file(envFile).text();
  for (const line of env.split('\n')) {
    if (line.trim() && !line.startsWith('#')) {
      const [key, ...valueParts] = line.split('=');
      if (key && valueParts.length > 0) {
        process.env[key.trim()] = valueParts.join('=').trim();
      }
    }
  }
  console.log("📧 Loaded environment variables from .env.local");
} catch {
  console.log("📧 Using environment variables from system");
}

// Set up config path and validate environment
const configPath = join(import.meta.dir, "../config.toml");
const email = process.env.GMAIL_EMAIL;
const displayName = process.env.GMAIL_DISPLAY_NAME;

if (!email || !process.env.GMAIL_APP_PASSWORD) {
  console.error("❌ Missing required environment variables: GMAIL_EMAIL, GMAIL_APP_PASSWORD");
  process.exit(1);
}

console.log(`📧 Email Checker CLI - ${email}`);
console.log("---");

// Required labels for email classification
const REQUIRED_LABELS = [
  'ai-email-checker/daily-brief',
  'ai-email-checker/daily-brief-done'
];

// Ensure Gmail labels exist using Himalaya folder commands
async function ensureLabelsExist(): Promise<void> {
  console.log("🏷️ Ensuring required labels exist...");
  
  try {
    // List existing folders/labels
    const result = await $`himalaya -c ${configPath} folder list -o json`;
    const folders = JSON.parse(result.stdout.toString());
    const existingFolders = folders.map((folder: any) => folder.name);
    
    // Check and create missing labels
    for (const label of REQUIRED_LABELS) {
      if (!existingFolders.includes(label)) {
        console.log(`📝 Creating label: ${label}`);
        await $`himalaya -c ${configPath} folder add "${label}"`;
      } else {
        console.log(`✅ Label exists: ${label}`);
      }
    }
    
    console.log("🏷️ All required labels ready!");
  } catch (error) {
    console.error("❌ Failed to manage labels:");
    console.error(error);
    throw error;
  }
}

// Get unread emails from inbox
async function getUnreadEmails(): Promise<any[]> {
  console.log("📬 Fetching unread emails...");
  
  try {
    const result = await $`himalaya -c ${configPath} envelope list -o json`;
    const emails = JSON.parse(result.stdout.toString());
    
    // Filter for unread emails (those without "Seen" flag)
    const unreadEmails = emails.filter((email: any) => 
      !email.flags || !email.flags.includes("Seen")
    );
    
    console.log(`📧 Found ${unreadEmails.length} unread emails`);
    return unreadEmails;
  } catch (error) {
    console.error("❌ Failed to fetch emails:");
    console.error(error);
    throw error;
  }
}

try {
  console.log(`Using config: ${configPath}`);
  
  // Step 1: Ensure required labels exist
  await ensureLabelsExist();
  
  // Step 2: Get unread emails for processing
  const unreadEmails = await getUnreadEmails();
  
  if (unreadEmails.length === 0) {
    console.log("📭 No unread emails to process");
  } else {
    console.log("🔄 Ready to process emails (classification logic coming next)");
    
    // For now, just show what we found
    for (const email of unreadEmails.slice(0, 3)) {
      console.log(`📧 ${email.subject} - from ${email.from.addr || email.from.name}`);
    }
    if (unreadEmails.length > 3) {
      console.log(`📧 ... and ${unreadEmails.length - 3} more emails`);
    }
  }
  
  console.log("✅ Email classification setup complete!");
} catch (error) {
  console.error("❌ Failed to process emails:");
  console.error(error);
  process.exit(1);
}