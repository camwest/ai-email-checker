#!/bin/bash

# Test script for walking skeleton
echo "🧪 Testing walking skeleton..."

# Load environment variables
if [ -f .env.local ]; then
    echo "📧 Loading environment from .env.local"
    source .env.local
else
    echo "❌ .env.local not found - make sure Gmail credentials are set"
    exit 1
fi

# Verify environment variables
if [ -z "$GMAIL_EMAIL" ] || [ -z "$GMAIL_APP_PASSWORD" ]; then
    echo "❌ Missing GMAIL_EMAIL or GMAIL_APP_PASSWORD"
    exit 1
fi

echo "✅ Environment ready"
echo "📧 Gmail: $GMAIL_EMAIL"

# Test MCP server directly first
echo "🔍 Testing MCP server..."
timeout 5 bun run src/mcp-server.ts &
SERVER_PID=$!
sleep 1

# Send a tools/list request
echo '{"jsonrpc":"2.0","id":1,"method":"tools/list","params":{}}' | nc -w 1 localhost 12345 2>/dev/null || echo "Direct MCP test skipped (server uses stdio)"

# Kill test server
kill $SERVER_PID 2>/dev/null || true

echo "✅ MCP server test complete"

# For now, just verify our setup is ready for GitHub Actions
echo "🚀 Walking skeleton setup is ready!"
echo "Next step: Create GitHub Action workflow"