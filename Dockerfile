# ==========================================
# STAGE 1: Build & Transpile TypeScript
# ==========================================
FROM node:20-alpine AS builder

WORKDIR /app

# Copy package manifests
COPY package*.json ./

# Install all dependencies (including devDependencies for tsc)
RUN npm ci

# Copy source code and TS config files
COPY tsconfig.json eslint.config.mjs .prettierrc ./
COPY src ./src

# Compile TypeScript to JavaScript in /app/dist
RUN npm run build

# Prune devDependencies to keep only production dependencies
RUN npm prune --production

# ==========================================
# STAGE 2: Production Lightweight Image
# ==========================================
FROM node:20-alpine AS runner

WORKDIR /app

ENV NODE_ENV=production

# Create non-root user for container security
RUN addgroup -g 1001 -S nodejs && \
    adduser -S expressjs -u 1001

# Copy production node_modules & compiled JS dist from builder
COPY --from=builder /app/package.json ./
COPY --from=builder /app/node_modules ./node_modules
COPY --from=builder /app/dist ./dist

# Change ownership to non-root user
USER expressjs

EXPOSE 3000

HEALTHCHECK --interval=30s --timeout=5s --start-period=5s --retries=3 \
  CMD wget --no-verbose --tries=1 --spider http://localhost:3000/api/v1/health || exit 1

CMD ["node", "dist/server.js"]
