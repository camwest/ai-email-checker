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

// Get email IDs from command line arguments
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
  console.error('❌ No email IDs provided');
  console.log('Usage: bun run src/archive-emails.ts [--account work] <email-id-1> <email-id-2> ...');
  process.exit(1);
}

console.log(`📧 Archiving ${emailIds.length} email(s)${account ? ` from ${account} account` : ''}`);
console.log(`Email IDs: ${emailIds.join(', ')}`);

try {
  // Build the command with optional account flag
  let result;
  if (account) {
    result = await $`himalaya -c ./config.toml message move -a ${account} '[Gmail]/All Mail' ${emailIds}`.quiet();
  } else {
    result = await $`himalaya -c ./config.toml message move '[Gmail]/All Mail' ${emailIds}`.quiet();
  }
  
  if (result.exitCode === 0) {
    console.log(`✅ Successfully archived ${emailIds.length} email(s)`);
  } else {
    console.error(`❌ Failed to archive emails`);
    console.error(result.stderr.toString());
  }
} catch (error) {
  console.error('❌ Error running archive command:', error);
}