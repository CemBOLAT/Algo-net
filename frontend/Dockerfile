# Build stage
FROM node:18-alpine AS builder
WORKDIR /app

# Copy dependency files first (better caching)
COPY package.json package-lock.json* ./

# Explicitly install all dependencies (including devDependencies for Vite)
RUN npm ci

# Copy the rest of the source code
COPY . .

# Set build-time variables
ENV VITE_PYTHON_BASE=/pythonms
RUN npm run build

# Production stage
FROM nginx:stable-alpine
COPY --from=builder /app/dist /usr/share/nginx/html/algonet
COPY nginx.conf /etc/nginx/conf.d/default.conf
EXPOSE 80
CMD ["nginx", "-g", "daemon off;"]