# Stage 1: build the React + Vite app
FROM node:20-alpine AS builder
WORKDIR /app

# Install app dependencies
COPY package.json package-lock.json* ./
COPY yarn.lock* ./
RUN npm install

# Copy source and build
COPY . ./
RUN npm run build

# Stage 2: serve with nginx
FROM nginx:stable-alpine
COPY --from=builder /app/dist /usr/share/nginx/html

# Remove default nginx config and use a simple one for SPA routing
RUN rm /etc/nginx/conf.d/default.conf
COPY nginx.conf /etc/nginx/conf.d/default.conf

EXPOSE 80
CMD ["nginx", "-g", "daemon off;"]
