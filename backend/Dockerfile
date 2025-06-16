# Build stage
FROM node:20-bullseye-slim AS builder

WORKDIR /app

# Copy package files
COPY backend/package*.json ./
COPY backend/tsconfig.json ./
COPY backend/prisma ./prisma/

# Install dependencies and update package-lock.json with legacy peer deps
RUN npm install --legacy-peer-deps

# Generate Prisma client
RUN npx prisma generate

# Copy source code and data files
COPY backend/src ./src
COPY data ./data

# Build TypeScript code
RUN npm run build

# Production stage
FROM node:20-bullseye-slim

WORKDIR /app

# Install OpenSSL 1.1 compatibility package
RUN apt-get update && apt-get install -y openssl libssl1.1 && rm -rf /var/lib/apt/lists/*

# Copy package files and install production dependencies only
COPY backend/package*.json ./
COPY backend/prisma ./prisma/
RUN npm install --only=production --legacy-peer-deps

# Copy built files from builder stage
COPY --from=builder /app/dist ./dist
COPY --from=builder /app/node_modules/.prisma ./node_modules/.prisma
COPY --from=builder /app/node_modules/@prisma ./node_modules/@prisma
COPY --from=builder /app/data ./data

# Expose the port the app runs on
EXPOSE 3001

# Create a startup script that waits for the database and runs migrations
RUN echo '#!/bin/sh\necho "Waiting for database..."\nwhile ! nc -z db 5432; do\n  sleep 1\ndone\necho "Database is ready!"\nexec "$@"' > /app/docker-entrypoint.sh && chmod +x /app/docker-entrypoint.sh

# Install netcat for the wait script
RUN apt-get update && apt-get install -y netcat-traditional && rm -rf /var/lib/apt/lists/*

# Start the application
ENTRYPOINT ["/app/docker-entrypoint.sh"]
CMD ["node", "dist/src/server.js"] 