# Railway.app configuration for backend deployment
FROM node:18-alpine

WORKDIR /app

# Copy package files
COPY backend/package*.json ./
RUN npm ci

# Copy source code
COPY backend/src ./src
COPY backend/tsconfig.json ./
COPY shared ./shared

# Build the application
RUN npm run build

EXPOSE 3001

CMD ["npm", "start"]