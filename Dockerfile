# ==========================================
# STAGE 1: Builder
# ==========================================
FROM oven/bun:1 AS builder

WORKDIR /app

# Copy dependency manifests
COPY package.json bun.lock* ./

# Install all dependencies (including devDependencies)
RUN bun install --frozen-lockfile

# Copy the rest of the application source code
COPY . .

# Build the SvelteKit application for production (using Bun for Vite)
RUN bun --bun run build

# ==========================================
# STAGE 2: Runner
# ==========================================
FROM oven/bun:1-slim AS runner

WORKDIR /app

# Set production environment
ENV NODE_ENV=production
ENV PORT=3000
ENV DATABASE_PATH=/app/data/local.db

# Install only production dependencies
COPY package.json bun.lock* ./
RUN bun install --production --frozen-lockfile

# Copy compiled SvelteKit server
COPY --from=builder /app/build ./build

# Copy assets and static files needed at runtime
COPY --from=builder /app/static ./static

# Copy migration files and migration script to run on startup
COPY --from=builder /app/src/migrate.ts ./src/migrate.ts
COPY --from=builder /app/src/lib/server/db/migrations ./src/lib/server/db/migrations

# Copy entrypoint startup script
COPY --from=builder /app/entrypoint.sh ./entrypoint.sh
RUN chmod +x ./entrypoint.sh

# Create the data directory for the persistent SQLite database
RUN mkdir -p /app/data

# Expose server port
EXPOSE 3000

# Start SvelteKit application via entrypoint script
ENTRYPOINT ["./entrypoint.sh"]
