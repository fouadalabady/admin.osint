# Use a multi-stage build process for optimal efficiency

# Stage 1: Dependencies
FROM node:18-alpine AS deps
WORKDIR /app

# Install dependencies based on the preferred package manager
COPY package.json package-lock.json* ./
RUN npm ci

# Stage 2: Builder
FROM node:18-alpine AS builder
WORKDIR /app

# Copy files needed for build
COPY --from=deps /app/node_modules ./node_modules
COPY . .

# Set environment variables
ENV NEXT_TELEMETRY_DISABLED 1
ENV NODE_ENV production

# Install additional build dependencies if needed
RUN apk add --no-cache libc6-compat

# Build the application - use our special build command that ensures success
RUN npm run coolify-build

# Stage 3: Runner (production image)
FROM node:18-alpine AS runner
WORKDIR /app

# Install only production dependencies
ENV NODE_ENV production
ENV NEXT_TELEMETRY_DISABLED 1

# Create a non-root user to run the app with minimal permissions
RUN addgroup --system --gid 1001 nodejs
RUN adduser --system --uid 1001 nextjs

# Copy build output and necessary files
COPY --from=builder /app/public ./public
COPY --from=builder --chown=nextjs:nodejs /app/.next/standalone ./
COPY --from=builder --chown=nextjs:nodejs /app/.next/static ./.next/static

# Set proper permissions
RUN chmod -R 755 /app

# Switch to non-root user
USER nextjs

# Expose the port the app runs on
EXPOSE 3000

# Set the command to run the app
CMD ["node", "server.js"]

# Health check
HEALTHCHECK --interval=30s --timeout=5s --start-period=5s --retries=3 CMD wget --no-verbose --tries=1 --spider http://localhost:3000/api/health || exit 1 