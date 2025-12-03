FROM node:20-alpine

WORKDIR /app

# Copy shared package
COPY packages/shared /shared
WORKDIR /shared
RUN npm install && npm run build

# Switch back to app directory
WORKDIR /app

# Copy package files
COPY workers/ai/package*.json ./

# Install dependencies (will use local shared package)
RUN npm install /shared

# Copy AI worker source code
COPY workers/ai/ .

CMD ["npm", "run", "dev"]
