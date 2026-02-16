# ============================================================
# FamMeal Backend — Multi-stage Dockerfile
# ============================================================
# Stages:
#   deps    → production-only npm install
#   builder → full install + TypeScript compile
#   dev     → development target (tsx watch, bind mount)
#   runner  → minimal production image
# ============================================================

# ---------- base -------------------------------------------
FROM node:20-alpine AS base
WORKDIR /app

# bcrypt requires python3, make, g++ to compile native addon
RUN apk add --no-cache python3 make g++

# ---------- deps (production only) -------------------------
FROM base AS deps
COPY package.json package-lock.json ./
RUN npm ci --omit=dev --ignore-scripts \
    && npm rebuild bcrypt

# ---------- builder ----------------------------------------
FROM base AS builder
COPY package.json package-lock.json ./
RUN npm ci --ignore-scripts \
    && npm rebuild bcrypt

COPY tsconfig.json ./
COPY src/ src/
COPY workers/ workers/
COPY drizzle/ drizzle/
COPY drizzle.config.ts ./

RUN npm run build

# ---------- dev (used by docker-compose.override.yml) ------
FROM base AS dev
ENV NODE_ENV=development

COPY package.json package-lock.json ./
RUN npm ci --ignore-scripts \
    && npm rebuild bcrypt

# Source will be bind-mounted at runtime
COPY tsconfig.json ./
COPY drizzle.config.ts ./

EXPOSE 3000
CMD ["npx", "tsx", "watch", "--tsconfig", "tsconfig.json", "src/index.ts"]

# ---------- runner (production) ----------------------------
FROM node:20-alpine AS runner
WORKDIR /app

# dumb-init for proper PID 1 signal handling
RUN apk add --no-cache dumb-init curl \
    && addgroup -g 1001 -S appgroup \
    && adduser -S appuser -u 1001 -G appgroup

ENV NODE_ENV=production

# Copy production deps from deps stage
COPY --from=deps /app/node_modules ./node_modules
COPY --from=builder /app/dist ./dist
COPY --from=builder /app/drizzle ./drizzle
COPY --from=builder /app/drizzle.config.ts ./
COPY package.json ./

# Copy entrypoint script
COPY docker-entrypoint.sh ./
RUN chmod +x docker-entrypoint.sh

USER appuser

EXPOSE 3000

HEALTHCHECK --interval=15s --timeout=5s --start-period=30s --retries=3 \
    CMD curl -fs http://localhost:3000/health || exit 1

ENTRYPOINT ["dumb-init", "--"]
CMD ["./docker-entrypoint.sh"]
