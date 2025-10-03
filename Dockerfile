FROM node:18-alpine AS builder

WORKDIR /app

# Copy package files
COPY package*.json ./
COPY webapp/package*.json ./webapp/
COPY telegram-webapp/package*.json ./telegram-webapp/

# Install all dependencies for build with modern npm
RUN npm ci --include=dev || npm install
RUN cd webapp && npm ci --include=dev || npm install
RUN cd telegram-webapp && npm ci --legacy-peer-deps --include=dev || npm install --legacy-peer-deps

# Copy source code
COPY . .

# Build webapp with CI environment variable
RUN cd webapp && CI=false npm run build

# Build telegram-webapp with CI environment variable
RUN cd telegram-webapp && CI=false npm run build

FROM node:18-alpine

WORKDIR /app

# Install dumb-init for proper signal handling
RUN apk add --no-cache dumb-init

# Copy package files
COPY package*.json ./

# Install build tools for native modules
RUN apk add --no-cache python3 make g++

# Install only production dependencies and rebuild native modules
RUN npm ci --omit=dev || npm install --omit=dev && \
    npm rebuild sqlite3 --build-from-source

# Copy built application from builder stage
COPY --from=builder /app/src ./src
COPY --from=builder /app/webapp/build ./webapp/build
COPY --from=builder /app/telegram-webapp/build ./telegram-webapp/build

# Copy landing static files
COPY --from=builder /app/landing-static ./landing-static

# Create non-root user
RUN addgroup -g 1001 -S nodejs && \
    adduser -S nodejs -u 1001 && \
    chown -R nodejs:nodejs /app

USER nodejs

# Set environment variables for Railway
ENV NODE_ENV=production
# Railway will provide PORT environment variable
ENV PORT=${PORT:-3000}

EXPOSE 3000

# Health check - optimized for Railway
HEALTHCHECK --interval=30s --timeout=30s --start-period=60s --retries=5 \
  CMD node -e "require('http').get('http://localhost:3000/health', (r) => r.statusCode === 200 ? process.exit(0) : process.exit(1))"

ENTRYPOINT ["dumb-init", "--"]
CMD ["node", "src/index.js"]