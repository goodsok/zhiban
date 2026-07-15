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

# ---- Production Stage ----
FROM node:20-slim

# Install runtime libs for native modules
RUN apt-get update && apt-get install -y libstdc++6 && rm -rf /var/lib/apt/lists/*

# Enable pnpm via corepack for install
RUN corepack enable && corepack prepare pnpm@latest --activate

WORKDIR /app

# Copy workspace root files
COPY package.json pnpm-lock.yaml pnpm-workspace.yaml ./
COPY patches/ ./patches/
COPY server/package.json server/tsconfig.json server/nest-cli.json ./server/

# Install production dependencies (preserves pnpm symlink structure)
RUN pnpm install --no-frozen-lockfile --prod

# Copy built server
COPY --from=builder /app/server/dist ./server/dist

# NODE_PATH allows require() to find modules in pnpm's store
ENV NODE_PATH=/app/node_modules/.pnpm/node_modules:/app/server/node_modules
ENV PORT=3000
EXPOSE 3000

WORKDIR /app/server

CMD ["node", "dist/main.js"]
