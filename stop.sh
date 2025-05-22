#!/bin/bash

echo "Attempting to stop application on port 3000..."

# Try lsof method
PID=$(lsof -t -i:3000)
if [ -n "$PID" ]; then
    echo "Found process using lsof (PID: $PID)"
    kill -9 $PID
fi

# Try netstat method
PID=$(netstat -nlp | grep ':3000' | awk '{print $7}' | cut -d'/' -f1)
if [ -n "$PID" ]; then
    echo "Found process using netstat (PID: $PID)"
    kill -9 $PID
fi

# Final check using fuser
fuser -k 3000/tcp

# Verify port is free
sleep 1
if ! netstat -an | grep ':3000.*LISTEN' > /dev/null; then
    echo "Successfully stopped application on port 3000"
else
    echo "Failed to stop application on port 3000"
    exit 1
fi 