FROM alpine:latest

# Install nginx (plus optional busybox-extras for better directory listings)
RUN apk add --no-cache nginx

# Create necessary directories
RUN mkdir -p /run/nginx /var/www/html

# Copy your custom nginx.conf
COPY nginx.conf /etc/nginx/nginx.conf

# Run nginx in foreground
CMD ["nginx", "-g", "daemon off;"]
