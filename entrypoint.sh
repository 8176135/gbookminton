#!/bin/bash
set -e

# Run database migrations on startup
echo "Starting database migrations..."
node build/migrate.mjs
echo "Migrations complete!"

# Start the application and replace shell process (for proper signal handling)
echo "Starting SvelteKit application on port ${PORT:-3000}..."
exec node build/index.js