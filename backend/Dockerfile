# Base Node.js image
FROM node:20-alpine AS builder

WORKDIR /app

# Install dependencies needed for native modules (bcrypt, prisma)
RUN apk add --no-cache python3 make g++ openssl

# Copy package files and prisma schema
COPY package*.json ./
COPY prisma ./prisma/

# Install dependencies and generate Prisma client
RUN npm install --legacy-peer-deps
RUN npx prisma generate

# Copy source code and build NestJS
COPY . .
RUN npm run build

# Remove devDependencies to keep only production packages
RUN npm prune --production --legacy-peer-deps

# Production image (Minimal runner layer)
FROM node:20-alpine AS runner

WORKDIR /app

RUN apk add --no-cache openssl curl

ENV NODE_ENV=production
ENV PORT=3001

COPY --from=builder /app/package*.json ./
COPY --from=builder /app/node_modules ./node_modules
COPY --from=builder /app/dist ./dist
COPY --from=builder /app/prisma ./prisma

EXPOSE 3001

HEALTHCHECK --interval=30s --timeout=5s --start-period=10s --retries=3 \
    CMD curl -f http://localhost:3001/api/docs || exit 1

CMD ["node", "dist/src/main.js"]
