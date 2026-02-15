# Multi-stage Dockerfile for AI Character Prompt Generator
# Stage 1: Build the application
# Stage 2: Serve with nginx

# ==========================================
# Build Stage
# ==========================================
FROM node:18-alpine AS builder

# Set working directory
WORKDIR /app

# Copy package files
COPY package*.json ./

# Install dependencies
RUN npm ci --only=production

# Copy source code
COPY . .

# Build the application
RUN npm run build

# ==========================================
# Production Stage
# ==========================================
FROM nginx:alpine

# Copy built files from builder stage
COPY --from=builder /app/dist /usr/share/nginx/html

# Copy nginx configuration
COPY nginx.conf /etc/nginx/nginx.conf

# Expose port 80
EXPOSE 80

# Health check
HEALTHCHECK --interval=30s --timeout=3s --start-period=5s --retries=3 \
  CMD wget --quiet --tries=1 --spider http://localhost/ || exit 1

# Run nginx
CMD ["nginx", "-g", "daemon off;"]

# Labels
LABEL maintainer="your-email@example.com"
LABEL description="AI Character Prompt Generator - Desktop App for generating AI image prompts"
LABEL version="2.1.0"
