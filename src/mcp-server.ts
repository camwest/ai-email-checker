#!/usr/bin/env bun

import { Server } from "@modelcontextprotocol/sdk/server/index.js";
import { StdioServerTransport } from "@modelcontextprotocol/sdk/server/stdio.js";
import {
  CallToolRequestSchema,
  ListToolsRequestSchema,
} from "@modelcontextprotocol/sdk/types.js";
import { $ } from "bun";
import { join } from "path";
import { Octokit } from "@octokit/rest";

// Load environment variables from .env.local using Bun's built-in support
console.error(`📧 Gmail: ${Bun.env.GMAIL_EMAIL || 'not set'}`);
console.error(`📧 GitHub token: ${Bun.env.GITHUB_TOKEN ? 'set' : 'not set'}`);
console.error("📧 Environment loaded via Bun.env");

// Email interface for structured responses
interface EmailSummary {
  id: string;
  subject: string;
  from: string;
  date: string;
  snippet: string;
}

// Load environment and validate
const configPath = join(import.meta.dir, "../config.toml");
const email = Bun.env.GMAIL_EMAIL;
const githubToken = Bun.env.GITHUB_TOKEN;

if (!email || !Bun.env.GMAIL_APP_PASSWORD) {
  console.error("❌ Missing required environment variables: GMAIL_EMAIL, GMAIL_APP_PASSWORD");
  process.exit(1);
}

if (!githubToken) {
  console.error("❌ Missing required environment variable: GITHUB_TOKEN");
  process.exit(1);
}

// Initialize GitHub client
const octokit = new Octokit({
  auth: githubToken,
});

// Create MCP server
const server = new Server(
  {
    name: "email-processor",
    version: "1.0.0",
  },
  {
    capabilities: {
      tools: {},
    },
  }
);

// List available tools
server.setRequestHandler(ListToolsRequestSchema, async () => {
  return {
    tools: [
      {
        name: "list_unread_emails",
        description: "Get all unread emails from Gmail inbox with summary information",
        inputSchema: {
          type: "object",
          properties: {
            max_emails: {
              type: "number",
              description: "Maximum number of emails to return (default: 50)",
              default: 50
            }
          }
        },
      },
      {
        name: "create_github_issue",
        description: "Create a new GitHub issue in the specified repository",
        inputSchema: {
          type: "object",
          properties: {
            title: {
              type: "string",
              description: "The title of the GitHub issue"
            },
            body: {
              type: "string", 
              description: "The body content of the GitHub issue (supports Markdown)"
            },
            repo: {
              type: "string",
              description: "Repository in format 'owner/repo'",
              default: "camwest/ai-email-briefings"
            }
          },
          required: ["title", "body"]
        },
      },
    ],
  };
});

// Handle tool calls
server.setRequestHandler(CallToolRequestSchema, async (request) => {
  const { name, arguments: args } = request.params;

  switch (name) {
    case "list_unread_emails": {
      try {
        const maxEmails = (args as any)?.max_emails || 50;
        
        console.error(`📬 Fetching unread emails (max: ${maxEmails})...`);
        
        // Get emails from Himalaya
        const result = await $`himalaya -c ${configPath} envelope list -o json`;
        const emails = JSON.parse(result.stdout.toString());
        
        // Filter for unread emails (those without "Seen" flag)
        const unreadEmails = emails
          .filter((email: any) => !email.flags || !email.flags.includes("Seen"))
          .slice(0, maxEmails)
          .map((email: any): EmailSummary => ({
            id: email.id || email.uid || String(email.message_id),
            subject: email.subject || "(No Subject)",
            from: email.from?.addr || email.from?.name || "Unknown",
            date: email.date || email.internal_date || "Unknown",
            snippet: email.snippet || email.text_preview || email.body?.substring(0, 100) || "(No preview)"
          }));

        console.error(`📧 Found ${unreadEmails.length} unread emails`);

        const message = unreadEmails.length === 0 
          ? "No unread emails found in inbox. All emails are up to date!"
          : `Found ${unreadEmails.length} unread email(s) requiring attention.`;

        return {
          content: [
            {
              type: "text",
              text: JSON.stringify({
                success: true,
                count: unreadEmails.length,
                message: message,
                emails: unreadEmails,
                summary: unreadEmails.length === 0 
                  ? "Inbox is clear - no action needed."
                  : `${unreadEmails.length} unread emails need review.`
              }, null, 2)
            }
          ]
        };
      } catch (error) {
        console.error("❌ Failed to fetch emails:", error);
        return {
          content: [
            {
              type: "text", 
              text: JSON.stringify({
                success: false,
                error: error instanceof Error ? error.message : String(error)
              }, null, 2)
            }
          ],
          isError: true
        };
      }
    }

    case "create_github_issue": {
      try {
        const { title, body, repo = "camwest/ai-email-briefings" } = args as {
          title: string;
          body: string;
          repo?: string;
        };

        console.error(`📝 Creating GitHub issue: "${title}" in ${repo}...`);

        const [owner, repoName] = repo.split('/');
        if (!owner || !repoName) {
          throw new Error(`Invalid repo format: ${repo}. Expected 'owner/repo'`);
        }

        const response = await octokit.rest.issues.create({
          owner,
          repo: repoName,
          title,
          body,
        });

        console.error(`✅ Created issue #${response.data.number}: ${response.data.html_url}`);

        return {
          content: [
            {
              type: "text",
              text: JSON.stringify({
                success: true,
                issue_number: response.data.number,
                issue_url: response.data.html_url,
                title: response.data.title
              }, null, 2)
            }
          ]
        };
      } catch (error) {
        console.error("❌ Failed to create GitHub issue:", error);
        return {
          content: [
            {
              type: "text",
              text: JSON.stringify({
                success: false,
                error: error instanceof Error ? error.message : String(error)
              }, null, 2)
            }
          ],
          isError: true
        };
      }
    }

    default:
      throw new Error(`Unknown tool: ${name}`);
  }
});

// Start the server
async function main() {
  const transport = new StdioServerTransport();
  await server.connect(transport);
  console.error("📧 Email MCP Server started");
}

main().catch((error) => {
  console.error("❌ Server error:", error);
  process.exit(1);
});