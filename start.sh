#!/bin/bash

# Create logs directory if it doesn't exist
mkdir -p logs

# Export environment variable from .env if it exists
if [ -f .env ]; then
    export $(cat .env | xargs)
fi

# Start the application in the background with logging
nohup pnpm start > logs/app.log 2>&1 &

# Save the process ID
echo $! > .pid

echo "Application started in background. Process ID: $!"
echo "Logs are being written to logs/app.log"
echo "To view logs in real-time, use: tail -f logs/app.log" 