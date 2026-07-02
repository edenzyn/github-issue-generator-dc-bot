# Build Stage
FROM node:24-alpine AS builder

RUN echo "Building Started..."

WORKDIR /app

COPY package*.json .

RUN npm ci

COPY . .

RUN npm run build && echo "Build completed!"

# Deployment Stage
FROM node:24-alpine

RUN echo "Starting..."

WORKDIR /app

COPY --from=builder /app/dist ./dist

COPY package*.json .

RUN npm ci --omit=dev

CMD ["npm", "start"]