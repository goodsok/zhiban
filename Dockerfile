# ---- Build Stage ----
FROM node:20-slim AS builder

# Install build tools for native modules
RUN apt-get update && apt-get install -y python3 make g++ && rm -rf /var/lib/apt/lists/*

# Enable pnpm via corepack
RUN corepack enable && corepack prepare pnpm@latest --activate

WORKDIR /app

# Copy workspace root files for pnpm install
COPY package.json pnpm-lock.yaml pnpm-workspace.yaml ./

# Copy server package.json + config files
COPY server/package.json server/tsconfig.json server/nest-cli.json ./server/

# Install all dependencies (root + server workspace)
RUN pnpm install --no-frozen-lockfile

# Copy server source code
COPY server/ ./server/

# Build the server (webpack bundle)
RUN cd /app/server && pnpm build

# ---- Production Stage ----
FROM node:20-slim

# Install build tools for native modules (needed for better-sqlite3 postinstall)
RUN apt-get update && apt-get install -y python3 make g++ && rm -rf /var/lib/apt/lists/*

RUN corepack enable && corepack prepare pnpm@latest --activate

WORKDIR /app

# Copy workspace files for pnpm install
COPY package.json pnpm-lock.yaml pnpm-workspace.yaml ./
COPY server/package.json ./server/

# Install production dependencies only
RUN pnpm install --no-frozen-lockfile --prod

# Copy built server
COPY --from=builder /app/server/dist ./server/dist

# Railway provides PORT env var
ENV PORT=3000
EXPOSE 3000

WORKDIR /app/server

CMD ["node", "dist/main.js"]
