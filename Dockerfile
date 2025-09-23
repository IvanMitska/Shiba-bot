FROM node:18-alpine AS builder

WORKDIR /app

# Copy package files
COPY package*.json ./
COPY webapp/package*.json ./webapp/
COPY telegram-webapp/package*.json ./telegram-webapp/

# Install all dependencies for build
RUN npm install
RUN cd webapp && npm install
RUN cd telegram-webapp && npm install --legacy-peer-deps

# Copy source code
COPY . .

# Build webapp
RUN cd webapp && npm run build

# Build telegram-webapp
RUN cd telegram-webapp && npm run build

FROM node:18-alpine

WORKDIR /app

# Install dumb-init for proper signal handling
RUN apk add --no-cache dumb-init

# Copy package files
COPY package*.json ./

# Install only production dependencies (without postinstall)
RUN npm ci --only=production --ignore-scripts

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

EXPOSE 3000

ENTRYPOINT ["dumb-init", "--"]
CMD ["node", "src/index.js"]