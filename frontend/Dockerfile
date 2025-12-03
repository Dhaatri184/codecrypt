FROM node:20-alpine

WORKDIR /app

# Copy shared package
COPY packages/shared /shared
WORKDIR /shared
RUN npm install && npm run build

# Switch back to app directory
WORKDIR /app

# Copy package files
COPY frontend/package*.json ./

# Install dependencies (will use local shared package)
RUN npm install /shared

# Copy frontend source code
COPY frontend/ .

EXPOSE 3000

CMD ["npm", "run", "dev", "--", "--host"]
