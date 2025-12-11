#!/bin/bash
# Railway start script for Voice Reminder Worker Service

echo "Starting Voice Reminder Worker Service..."
echo "Node version: $(node --version)"
echo "NPM version: $(npm --version)"

# Start the worker and webhook server
exec npm run dev
