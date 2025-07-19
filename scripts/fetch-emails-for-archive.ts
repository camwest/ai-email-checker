#!/usr/bin/env bun

import { $ } from "bun";

// Bun automatically loads .env.local files
// Ensure environment variables are loaded
if (!process.env.GMAIL_APP_PASSWORD) {
  console.error("Error: GMAIL_APP_PASSWORD not found in environment");
  process.exit(1);
}

async function fetchEmails() {
  console.log("## Personal emails (gmail account):");
  console.log("```");
  try {
    const personalEmails = await $`himalaya -c ./config.toml envelope list -s 50`.text();
    console.log(personalEmails);
  } catch (error) {
    console.error("Failed to fetch personal emails:", error);
  }
  console.log("```\n");

  console.log("## Work emails:");
  console.log("```");
  try {
    const workEmails = await $`himalaya -c ./config.toml envelope list -a work -s 50`.text();
    console.log(workEmails);
  } catch (error) {
    console.error("Failed to fetch work emails:", error);
  }
  console.log("```");
}

await fetchEmails();