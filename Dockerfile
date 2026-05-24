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

# Create data directory and ensure ownership by bun user BEFORE copying files
RUN mkdir -p /app/data && chown -R bun:bun /app

# Install only production dependencies
COPY --chown=bun:bun package.json bun.lock* ./
RUN bun install --production --frozen-lockfile && chown -R bun:bun /app

# Copy compiled SvelteKit server
COPY --from=builder --chown=bun:bun /app/build ./build

# Copy assets and static files needed at runtime
COPY --from=builder --chown=bun:bun /app/static ./static

# Copy migration files and migration script to run on startup
COPY --from=builder --chown=bun:bun /app/src/migrate.ts ./src/migrate.ts
COPY --from=builder --chown=bun:bun /app/src/lib/server/db/migrations ./src/lib/server/db/migrations

# Copy entrypoint startup script
COPY --from=builder --chown=bun:bun /app/entrypoint.sh ./entrypoint.sh
RUN chmod +x ./entrypoint.sh

# Switch to the non-root bun user
USER bun

# Expose server port
EXPOSE 3000

# Start SvelteKit application via entrypoint script
ENTRYPOINT ["./entrypoint.sh"]
