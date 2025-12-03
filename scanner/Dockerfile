FROM node:20-alpine

# Install git for repository cloning
RUN apk add --no-cache git

WORKDIR /app

# Copy shared package
COPY packages/shared /shared
WORKDIR /shared
RUN npm install && npm run build

# Switch back to app directory
WORKDIR /app

# Copy package files
COPY scanner/package*.json ./

# Install dependencies (will use local shared package)
RUN npm install /shared

# Copy scanner source code
COPY scanner/ .

CMD ["npm", "run", "dev"]
