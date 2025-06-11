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

try {
  // Debug config path
  console.log(`Using config: ${configPath}`);
  
  // Test connection and list recent emails
  console.log("🔍 Checking recent emails...");
  const result = await $`himalaya -c ${configPath} envelope list --max-width 120 | head -10`;
  console.log(result.stdout.toString());
  
  console.log("✅ Successfully connected to Gmail!");
} catch (error) {
  console.error("❌ Failed to connect to Gmail:");
  console.error(error);
  process.exit(1);
}