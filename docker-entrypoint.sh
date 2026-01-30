#!/bin/sh
set -e

# Run database migrations
echo "Running database migrations..."
npx prisma db push --skip-generate

# Start the application
echo "Starting the application..."
exec node server.js
