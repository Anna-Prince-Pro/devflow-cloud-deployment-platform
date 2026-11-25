# =============================================================================
# DevFlow — Frontend Multi-Stage Dockerfile (React 18 + Vite + Nginx)
# =============================================================================

# --- Stage 1: Build Stage ---
FROM node:20-alpine AS builder

WORKDIR /app

# Copy package descriptors for reproducible installation
COPY package.json package-lock.json ./

# Install clean production and dev dependencies for build
RUN npm ci

# Copy application source code and configuration files
COPY tsconfig.json tsconfig.node.json vite.config.ts tailwind.config.js postcss.config.js index.html ./
COPY src ./src

# Set build-time argument for API Base URL
ARG VITE_API_BASE_URL=http://localhost:8000/api/v1
ENV VITE_API_BASE_URL=$VITE_API_BASE_URL

# Build production assets
RUN npm run build

# --- Stage 2: Production Nginx Serving Stage ---
FROM nginx:1.27-alpine AS production

# Remove default nginx html files
RUN rm -rf /usr/share/nginx/html/*

# Copy built production assets from builder stage
COPY --from=builder /app/dist /usr/share/nginx/html

# Copy custom Nginx configuration
COPY nginx.conf /etc/nginx/conf.d/default.conf

# Expose HTTP port
EXPOSE 80

# Healthcheck probe using wget (built into Alpine)
HEALTHCHECK --interval=15s --timeout=5s --start-period=5s --retries=3 \
    CMD wget -q -O /dev/null http://127.0.0.1/ || exit 1

# Start Nginx in foreground
CMD ["nginx", "-g", "daemon off;"]
