# ==========================================
# STAGE 1: Builder
# ==========================================
FROM node:22-slim AS builder

WORKDIR /app

# Install pnpm (npm is bundled with Node)
RUN npm install -g pnpm@10.2.1

# Copy dependency manifests
COPY package.json pnpm-lock.yaml ./

# Install all dependencies (including devDependencies)
RUN pnpm install --frozen-lockfile

# Copy the rest of the application source code
COPY . .

# Build the SvelteKit application for production
RUN pnpm build

# Compile the programmatic migration script for the runner stage
RUN pnpm exec esbuild src/migrate.ts --bundle --platform=node --format=esm --packages=external --outfile=build/migrate.mjs

# ==========================================
# STAGE 2: Runner
# ==========================================
FROM node:22-slim AS runner

WORKDIR /app

# Set production environment
ENV NODE_ENV=production
ENV PORT=3000
ENV DATABASE_PATH=/app/data/local.db

# Install pnpm
RUN npm install -g pnpm@10.2.1

# Create data directory and ensure ownership by node user BEFORE copying files
RUN mkdir -p /app/data && chown -R node:node /app

# Install only production dependencies
COPY --chown=node:node package.json pnpm-lock.yaml ./
RUN pnpm install --prod --frozen-lockfile && chown -R node:node /app

# Copy compiled SvelteKit server
COPY --from=builder --chown=node:node /app/build ./build

# Copy assets and static files needed at runtime
COPY --from=builder --chown=node:node /app/static ./static

# Copy migration files needed at startup
COPY --from=builder --chown=node:node /app/src/lib/server/db/migrations ./src/lib/server/db/migrations

# Copy entrypoint startup script
COPY --from=builder --chown=node:node /app/entrypoint.sh ./entrypoint.sh
RUN chmod +x ./entrypoint.sh

# Switch to the non-root node user
USER node

# Expose server port
EXPOSE 3000

# Start SvelteKit application via entrypoint script
ENTRYPOINT ["./entrypoint.sh"]