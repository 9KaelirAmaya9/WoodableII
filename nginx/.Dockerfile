# Dockerfile for Nginx (Frontend)
# Multi-stage build: Build React App -> Serve with Nginx

ARG REACT_APP_NODE_VERSION=18-alpine
ARG NGINX_VERSION=1.25-alpine

# --- Stage 1: Build React App ---
FROM node:${REACT_APP_NODE_VERSION} AS build

WORKDIR /app
ARG REACT_APP_API_URL
ENV REACT_APP_API_URL=${REACT_APP_API_URL}
ENV NODE_ENV=production

# Install dependencies (cache layer)
COPY ./react-app/package*.json ./
RUN npm ci

# Copy source and build
COPY ./react-app/ .
RUN npm run build

# --- Stage 2: Serve with Nginx ---
FROM nginx:${NGINX_VERSION}

# Install envsubst
RUN apk add --no-cache gettext

# Build Args for Nginx
ARG NGINX_WORKER_PROCESSES=auto
ARG NGINX_WORKER_CONNECTIONS=1024
ARG NGINX_PORT=80

# Environment Variables
ENV NGINX_WORKER_PROCESSES=${NGINX_WORKER_PROCESSES} \
    NGINX_WORKER_CONNECTIONS=${NGINX_WORKER_CONNECTIONS} \
    NGINX_PORT=${NGINX_PORT}

# Create non-root user/groups if needed (alpine nginx usually has nginx user)
# Ensure directories exist
RUN mkdir -p /var/cache/nginx /var/log/nginx /etc/nginx/conf.d && \
    touch /var/run/nginx.pid && \
    chown -R nginx:nginx /var/cache/nginx /var/log/nginx /etc/nginx/conf.d /var/run/nginx.pid

# Copy Nginx Config Template
COPY ./nginx/nginx.conf /etc/nginx/templates/nginx.conf.template

# Copy React Build Artifacts
# Clean default directory first
RUN rm -rf /usr/share/nginx/html/*
COPY --from=build /app/build /usr/share/nginx/html

# Entrypoint Script
RUN echo '#!/bin/sh' > /docker-entrypoint.sh && \
    echo 'set -e' >> /docker-entrypoint.sh && \
    echo '# Generate nginx config' >> /docker-entrypoint.sh && \
    echo 'envsubst "\$NGINX_WORKER_PROCESSES \$NGINX_WORKER_CONNECTIONS \$NGINX_PORT" < /etc/nginx/templates/nginx.conf.template > /etc/nginx/nginx.conf' >> /docker-entrypoint.sh && \
    echo 'exec nginx -g "daemon off;"' >> /docker-entrypoint.sh && \
    chmod +x /docker-entrypoint.sh

# Expose Port (internal only)
EXPOSE ${NGINX_PORT}

# Health Check
HEALTHCHECK --interval=30s --timeout=3s --start-period=10s --retries=3 \
    CMD wget --quiet --tries=1 --spider http://localhost:${NGINX_PORT}/health || exit 1

ENTRYPOINT ["/docker-entrypoint.sh"]
