#!/bin/bash

# Kill process running on port 3000
PID=$(lsof -t -i:3000)
if [ -n "$PID" ]; then
    echo "Stopping application on port 3000 (PID: $PID)..."
    kill $PID
    echo "Application stopped"
else
    echo "No process found running on port 3000"
fi 