#!/bin/bash

# Script to check if Firebase emulators are running
# Checks ports 9099, 8080, and 5001
# If any ports are closed, starts the emulators
# If all ports are open, outputs success message

set -e

PORTS=(9099 8080 5001)
CLOSED_PORTS=()

echo "Checking emulator ports..."

# Check each port
for port in "${PORTS[@]}"; do
  if ! nc -z localhost "$port" 2>/dev/null; then
    CLOSED_PORTS+=("$port")
    echo "Port $port is closed"
  else
    echo "Port $port is open"
  fi
done

# If any ports are closed, start emulators
if [ ${#CLOSED_PORTS[@]} -gt 0 ]; then
  echo "Starting Firebase emulators..."
  firebase emulators:start
  exit $?
fi

# All ports are open
echo "Emulators are already running"
exit 0
