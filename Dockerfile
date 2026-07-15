# ---- Build Stage ----
FROM node:20-slim AS builder

# Install build tools for native modules
RUN apt-get update && apt-get install -y python3 make g++ && rm -rf /var/lib/apt/lists/*

# Enable pnpm via corepack
RUN corepack enable && corepack prepare pnpm@latest --activate

WORKDIR /app

# Copy workspace root files for pnpm install
COPY package.json pnpm-lock.yaml pnpm-workspace.yaml ./
COPY patches/ ./patches/

# Copy server package.json + config files
COPY server/package.json server/tsconfig.json server/nest-cli.json ./server/

# Install all dependencies (root + server workspace)
RUN pnpm install --no-frozen-lockfile

# Copy server source code
COPY server/ ./server/

# Build the server (webpack bundle)
RUN cd /app/server && pnpm build

# Prune dev dependencies for production
RUN pnpm install --no-frozen-lockfile --prod

# ---- Production Stage ----
FROM node:20-slim

# Install runtime libs for native modules (better-sqlite3 needs libstdc++, etc.)
RUN apt-get update && apt-get install -y libstdc++6 && rm -rf /var/lib/apt/lists/*

WORKDIR /app

# Copy pruned node_modules and built server from builder
COPY --from=builder /app/node_modules ./node_modules
COPY --from=builder /app/server/node_modules ./server/node_modules
COPY --from=builder /app/server/dist ./server/dist
COPY --from=builder /app/server/package.json ./server/package.json

# Railway provides PORT env var
ENV PORT=3000
EXPOSE 3000

WORKDIR /app/server

CMD ["node", "dist/main.js"]
