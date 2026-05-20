#!/bin/bash
# Helper to call Framer MCP tools
FRAMER_URL="https://mcp.unframer.co/mcp?id=b7cd37aa4aff532f8a2c41da6e9f4fef8e1e8789b63c3715f569ab1b090ac000&secret=zBFkO9f1UNZyaqtI5Hv9B2s0YtWnqH7s"

framer_call() {
  local tool="$1"
  local args="$2"
  curl -s -X POST "$FRAMER_URL" \
    -H "Content-Type: application/json" \
    -H "Accept: application/json, text/event-stream" \
    -d "{\"jsonrpc\":\"2.0\",\"method\":\"tools/call\",\"params\":{\"name\":\"$tool\",\"arguments\":$args},\"id\":$RANDOM}" 2>&1
}
