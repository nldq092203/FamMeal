# ============================================================
# FamMeal Frontend — Multi-stage Dockerfile
# ============================================================
# Stages:
#   deps    → npm install
#   builder → vite build (produces static SPA)
#   dev     → development target (vite dev server)
#   runner  → nginx:alpine serving the SPA
# ============================================================

# ---------- deps -------------------------------------------
FROM node:20-alpine AS deps
WORKDIR /app
COPY package.json package-lock.json ./
RUN npm ci

# ---------- builder ----------------------------------------
FROM deps AS builder
WORKDIR /app

ARG VITE_API_BASE_URL=http://localhost:3000/api
ENV VITE_API_BASE_URL=$VITE_API_BASE_URL

COPY . .
RUN npm run build

# ---------- dev (used by docker-compose.override.yml) ------
FROM deps AS dev
WORKDIR /app
ENV NODE_ENV=development

# Source will be bind-mounted at runtime
COPY . .

EXPOSE 5173
CMD ["npx", "vite", "--host", "0.0.0.0", "--port", "5173"]

# ---------- runner (production — nginx) --------------------
FROM nginx:1.27-alpine AS runner

# Remove default nginx config
RUN rm /etc/nginx/conf.d/default.conf

# Copy custom nginx configuration
COPY nginx.conf /etc/nginx/conf.d/default.conf

# Copy built SPA from builder stage
COPY --from=builder /app/dist /usr/share/nginx/html

# Non-root: nginx alpine image supports this out of the box
# We keep the default nginx user (101)

EXPOSE 80

HEALTHCHECK --interval=15s --timeout=5s --start-period=10s --retries=3 \
    CMD wget -qO- http://localhost:80/ || exit 1

CMD ["nginx", "-g", "daemon off;"]
