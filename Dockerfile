# ── Stage 1: Install production dependencies ──
FROM node:24-alpine AS deps

WORKDIR /app

COPY package.json package-lock.json ./
RUN npm ci --omit=dev

# ── Stage 2: Production image ──
FROM node:24-alpine AS runner

WORKDIR /app
ENV NODE_ENV=production PORT=3000

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

# Readiness includes MongoDB availability. Native fetch respects runtime port/prefix.
HEALTHCHECK --interval=30s --timeout=5s --start-period=15s --retries=3 \
  CMD node -e "fetch('http://127.0.0.1:'+(process.env.PORT||3000)+(process.env.API_PREFIX||'/api/v1')+'/health/ready').then(r=>{if(!r.ok)process.exit(1)}).catch(()=>process.exit(1))"

# No .env is copied/read. Inject secrets through the container runtime.
CMD ["node", "src/server.js"]
