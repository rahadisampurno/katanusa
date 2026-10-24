# Stage 1: Build the application
FROM node:22-slim as builder

WORKDIR /app

ARG VITE_API_URL=http://localhost:8081/api
ARG VITE_MIDTRANS_CLIENT_KEY=
ENV VITE_API_URL=$VITE_API_URL
ENV VITE_MIDTRANS_CLIENT_KEY=$VITE_MIDTRANS_CLIENT_KEY

# Copy package files and install dependencies
COPY package.json package-lock.json ./
RUN npm ci

# Copy the rest of the application source code
COPY . .

# Build the application
RUN npm run build

# Stage 2: Serve the application with Nginx
FROM nginx:stable-alpine

# Copy the built files from the builder stage
COPY --from=builder /app/dist /usr/share/nginx/html

# Copy the Nginx configuration
COPY nginx.conf /etc/nginx/conf.d/default.conf

# Expose port 80
EXPOSE 8085

# Start Nginx
CMD ["nginx", "-g", "daemon off;"]
