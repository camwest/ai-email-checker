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
  // Gmail archiving: Move from INBOX to a non-inbox location
  // Since All Mail contains everything, we move from INBOX to All Mail view
  let command, result;
  if (account) {
    command = `himalaya -c ./config.toml message move -a ${account} -f INBOX '[Gmail]/All Mail' ${emailIds.join(' ')}`;
    result = await $`himalaya -c ./config.toml message move -a ${account} -f INBOX '[Gmail]/All Mail' ${emailIds}`;
  } else {
    command = `himalaya -c ./config.toml message move -f INBOX '[Gmail]/All Mail' ${emailIds.join(' ')}`;
    result = await $`himalaya -c ./config.toml message move -f INBOX '[Gmail]/All Mail' ${emailIds}`;
  }
  
  console.log(`🔧 Command executed: ${command}`);
  console.log(`📤 Exit code: ${result.exitCode}`);
  
  if (result.stdout) {
    console.log(`📋 Output: ${result.stdout.toString()}`);
  }
  if (result.stderr) {
    console.log(`⚠️  Stderr: ${result.stderr.toString()}`);
  }
  
  if (result.exitCode === 0) {
    console.log(`✅ Successfully archived ${emailIds.length} email(s) by moving from INBOX`);
  } else {
    console.error(`❌ Failed to archive emails`);
    console.error(result.stderr.toString());
  }
} catch (error) {
  console.error('❌ Error running archive command:', error);
}