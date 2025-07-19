#!/usr/bin/env bun

import { $ } from "bun";

// Verify environment variables are loaded
const requiredEnvVars = ['GMAIL_EMAIL', 'GMAIL_APP_PASSWORD', 'GMAIL_DISPLAY_NAME'];
for (const varName of requiredEnvVars) {
  if (!process.env[varName]) {
    console.error(`❌ Missing required environment variable: ${varName}`);
    process.exit(1);
  }
}

// Get email ID from command line arguments
const args = process.argv.slice(2);
const account = args.includes('-a') || args.includes('--account') ? 
  args[args.findIndex(arg => arg === '-a' || arg === '--account') + 1] : null;

// Filter out the account flag and value from email IDs
const emailIds = args.filter((arg, index) => {
  const prevArg = args[index - 1];
  return arg !== '-a' && arg !== '--account' && 
         prevArg !== '-a' && prevArg !== '--account';
});

if (emailIds.length === 0) {
  console.error('❌ No email ID provided');
  console.log('Usage: bun run src/read-email.ts [--account work] <email-id>');
  process.exit(1);
}

if (emailIds.length > 1) {
  console.error('❌ Please provide only one email ID');
  process.exit(1);
}

const emailId = emailIds[0];

try {
  // Build the command with optional account flag
  let result;
  if (account) {
    result = await $`himalaya -c ./config.toml -a ${account} message read ${emailId}`.text();
  } else {
    result = await $`himalaya -c ./config.toml message read ${emailId}`.text();
  }
  
  console.log(result);
} catch (error) {
  console.error('❌ Error reading email:', error);
  process.exit(1);
}