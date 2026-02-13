#!/bin/sh
set -e

echo "Running database migrations..."
npx drizzle-kit migrate

echo "Starting server..."
node server.js
