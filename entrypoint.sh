#!/bin/bash
set -e

# Apply the Drizzle migration journal on startup (SQLite, uses DATABASE_PATH
# from the environment via drizzle.config.ts)
echo "Applying database migrations..."
pnpm exec drizzle-kit migrate
echo "Migrations complete!"

# Start the application and replace shell process (for proper signal handling)
echo "Starting SvelteKit application on port ${PORT:-3000}..."
exec node build/index.js