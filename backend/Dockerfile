FROM node:20-alpine

WORKDIR /app

# Copy package files
COPY backend/package*.json ./

# Copy shared package
COPY packages/shared /shared
WORKDIR /shared
RUN npm install && npm run build

# Switch back to app directory
WORKDIR /app

# Install dependencies (will use local shared package)
RUN npm install /shared

# Copy backend source code
COPY backend/ .

# Expose port
EXPOSE 4000

# Start the application
CMD ["npm", "run", "dev"]
