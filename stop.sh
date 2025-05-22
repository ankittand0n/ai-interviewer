#!/bin/bash

if [ -f .pid ]; then
    PID=$(cat .pid)
    if ps -p $PID > /dev/null; then
        echo "Stopping application (PID: $PID)..."
        kill $PID
        rm .pid
        echo "Application stopped"
    else
        echo "Process not found. Application may have already stopped."
        rm .pid
    fi
else
    echo "PID file not found. Application may not be running."
fi 