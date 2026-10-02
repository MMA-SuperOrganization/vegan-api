# ── Stage 1: Install production dependencies ──
FROM node:24-alpine AS deps

WORKDIR /app

COPY package.json package-lock.json ./
RUN npm ci --omit=dev

# ── Stage 2: Production image ──
FROM node:24-alpine AS runner

WORKDIR /app

# Create non-root user for security
RUN addgroup --system --gid 1001 nodejs && \
    adduser --system --uid 1001 appuser

# Copy production node_modules from deps stage
COPY --from=deps /app/node_modules ./node_modules

# Copy application source
COPY package.json ./
COPY src ./src
COPY docs ./docs
COPY scripts ./scripts

# Set ownership
RUN chown -R appuser:nodejs /app

USER appuser

# Expose the default port
EXPOSE 3000

# Health check — hit the /api/v1/health endpoint
HEALTHCHECK --interval=30s --timeout=5s --start-period=10s --retries=3 \
  CMD wget --no-verbose --tries=1 --spider http://localhost:3000/api/v1/health || exit 1

# Use --env-file so .env is loaded by Node.js at startup
# In Docker, env vars are injected via docker-compose or -e flags,
# so we start without --env-file here (env vars come from container runtime)
CMD ["node", "src/server.js"]
