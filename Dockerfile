# Scout - Production Docker Image
FROM node:18-alpine

# Set metadata
LABEL name="scout"
LABEL version="1.0.0"
LABEL description="Scout AI Knowledge Assistant"
LABEL maintainer="Arrow Development Team"

# Set working directory
WORKDIR /app

# Create non-root user for security
RUN addgroup -g 1001 -S nodejs && \
    adduser -S scout -u 1001 -G nodejs

# Install system dependencies
RUN apk add --no-cache \
    curl \
    ca-certificates \
    && rm -rf /var/cache/apk/*

# Copy package files
COPY package*.json ./

# Install dependencies
RUN npm ci --only=production && \
    npm cache clean --force

# Copy application code
COPY . .

# Create required directories with proper permissions
RUN mkdir -p uploads data logs public && \
    chown -R scout:nodejs /app && \
    chmod 755 uploads data logs public

# Switch to non-root user
USER scout

# Expose ports
EXPOSE 3000

# Health check
HEALTHCHECK --interval=30s --timeout=10s --start-period=60s --retries=3 \
  CMD curl -f http://localhost:3000/health || exit 1

# Environment defaults
ENV NODE_ENV=production \
    PORT=3000

# Start application
CMD ["npm", "start"]