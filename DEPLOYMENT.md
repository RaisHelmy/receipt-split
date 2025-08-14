# Bill Manager Deployment Guide

## Docker Hub Image

The Bill Manager application is available as a Docker image on Docker Hub, supporting both ARM64 and AMD64 architectures:
- **Latest (Multi-platform)**: `raishelmy/bill-manager:latest` 
- **Version 1.7 (Delete Bills)**: `raishelmy/bill-manager:v1.7-delete-bills` (Added delete button to bill listing with confirmation)
- **Version 1.6 (Custom Reference)**: `raishelmy/bill-manager:v1.6-custom-reference` (Added custom reference parameter to create command)
- **Version 1.5 (Delete Items)**: `raishelmy/bill-manager:v1.5-delete-items` (Added delete button in UI and remove command in terminal)
- **Version 1.4 (Fixed Batch)**: `raishelmy/bill-manager:v1.4-fixed-batch` (Fixed batch command splitting bug)
- **Version 1.3 (Multiline)**: `raishelmy/bill-manager:v1.3-multiline` (Added multiline command support)
- **Version 1.2 (Batch Commands)**: `raishelmy/bill-manager:v1.2-batch-commands` (Fixed batch add commands)
- **Version 1.1 Multi-arch**: `raishelmy/bill-manager:v1.1-multiarch` (Fixed quoted string parsing in terminal)
- **Version 1.0 Multi-arch**: `raishelmy/bill-manager:v1.0-multiarch`

**Supported Platforms:**
- `linux/amd64` - Intel/AMD 64-bit processors
- `linux/arm64` - ARM 64-bit processors (Apple Silicon, ARM servers, Raspberry Pi 4/5)

## Quick Start with Docker

### Option 1: Using Docker Run

```bash
# Pull and run the latest image
docker pull raishelmy/bill-manager:latest

# Run the container
docker run -d \
  --name bill-manager \
  -p 3000:3000 \
  -v bill-manager-data:/app/data \
  -e NEXTAUTH_SECRET=your-production-secret-key-change-this \
  -e NEXTAUTH_URL=http://localhost:3000 \
  raishelmy/bill-manager:latest
```

### Option 2: Using Docker Compose

Create a `docker-compose.yml` file:

```yaml
version: '3.8'

services:
  bill-manager:
    image: raishelmy/bill-manager:latest
    container_name: bill-manager-app
    ports:
      - "3000:3000"
    environment:
      - DATABASE_URL=file:/app/data/prod.db
      - NEXTAUTH_SECRET=your-production-secret-key-change-this
      - NEXTAUTH_URL=http://localhost:3000
      - NODE_ENV=production
    volumes:
      - bill-manager-data:/app/data
    restart: unless-stopped
    healthcheck:
      test: ["CMD", "wget", "--no-verbose", "--tries=1", "--spider", "http://localhost:3000/api/bills"]
      interval: 30s
      timeout: 10s
      retries: 3
      start_period: 40s

volumes:
  bill-manager-data:
    driver: local
```

Then run:

```bash
docker compose up -d
```

## Environment Variables

Required environment variables:

- `NEXTAUTH_SECRET`: A secret key for JWT authentication (change this in production)
- `NEXTAUTH_URL`: The base URL of your application
- `DATABASE_URL`: SQLite database file path (automatically set to `/app/data/prod.db`)
- `NODE_ENV`: Set to `production` for production deployments

## Database

The application uses SQLite database with automatic initialization:

- Database file is stored at `/app/data/prod.db` inside the container
- Database is automatically created and migrated on first startup
- Data persists using Docker volumes (`bill-manager-data`)

## Features

- **User Authentication**: Sign up/sign in with JWT-based authentication
- **Bill Management**: Create, edit, and manage bills with items
- **Multi-Currency Support**: Default RM currency with multiple currency options
- **Visibility Modes**: Private, Read-only (public view), Public (public edit)
- **Public Sharing**: Share bills via public URLs with anonymous access
- **Terminal Interface**: Floating terminal for command-based bill management
- **Financial Commands**: Tax, service charge, voucher/discount management

## Port and Access

- **Port**: The application runs on port 3000 inside the container
- **Access**: Open http://localhost:3000 in your browser after startup
- **Health Check**: Available at `/api/bills` endpoint

## Building from Source

If you want to build the image yourself:

### Single Platform Build
```bash
# Clone the repository
git clone <your-repo-url>
cd receipt-split

# Build for current platform
docker build -t bill-manager:latest .

# Run the image
docker run -d -p 3000:3000 -v bill-manager-data:/app/data bill-manager:latest
```

### Multi-Platform Build
```bash
# Create and use multi-platform builder
docker buildx create --name multi-platform --use
docker buildx inspect --bootstrap

# Build for both AMD64 and ARM64
docker buildx build --platform linux/amd64,linux/arm64 -t your-registry/bill-manager:latest --push .
```

## Production Considerations

1. **Change the NEXTAUTH_SECRET**: Use a strong, unique secret in production
2. **Set proper NEXTAUTH_URL**: Update to match your domain
3. **SSL/HTTPS**: Configure reverse proxy (nginx/traefik) for HTTPS
4. **Backups**: Regularly backup the `/app/data/prod.db` file
5. **Updates**: Pull latest image and restart container for updates

## Terminal Commands

The floating terminal supports these commands:

- `create <bill-name> [reference] [currency] [visibility]` - Create new bill with optional custom reference
- `list` - List all bills
- `add <bill-ref> <item-name> <price> [quantity]` - Add item to bill
- `remove <bill-ref> <item-index>` - Remove item from bill by index
- `tax <percentage>` - Set tax percentage
- `service <percentage>` - Set service charge percentage
- `voucher <amount>` - Set discount voucher amount
- `share` - Get public sharing URL
- `visibility <private|read-only|public>` - Change bill visibility
- `currency <code>` - Change bill currency
- `help` - Show available commands

## Updating Your Docker Container

When new versions are released, you can update your container using these steps:

### Method 1: Using Docker Run (Simple Update)

```bash
# Stop and remove the old container
docker stop bill-manager
docker rm bill-manager

# Pull the latest image
docker pull raishelmy/bill-manager:latest

# Run the new container (your data persists in the volume)
docker run -d \
  --name bill-manager \
  -p 3000:3000 \
  -v bill-manager-data:/app/data \
  -e NEXTAUTH_SECRET=your-production-secret-key-change-this \
  -e NEXTAUTH_URL=http://localhost:3000 \
  raishelmy/bill-manager:latest
```

### Method 2: Using Docker Compose (Recommended)

```bash
# Pull the latest image
docker compose pull

# Stop and recreate containers with new image
docker compose up -d

# Alternative: force recreation
docker compose up -d --force-recreate
```

### Method 3: Specific Version Update

```bash
# Stop current container
docker stop bill-manager
docker rm bill-manager

# Pull specific version
docker pull raishelmy/bill-manager:v1.7-delete-bills

# Run with specific version
docker run -d \
  --name bill-manager \
  -p 3000:3000 \
  -v bill-manager-data:/app/data \
  -e NEXTAUTH_SECRET=your-production-secret-key-change-this \
  -e NEXTAUTH_URL=http://localhost:3000 \
  raishelmy/bill-manager:v1.7-delete-bills
```

### Data Persistence

Your bills and data are stored in the Docker volume `bill-manager-data` and will **persist across updates**. The database file is located at `/app/data/prod.db` inside the container.

### Update Checklist

1. ✅ **Stop the old container**: `docker stop bill-manager`
2. ✅ **Remove the old container**: `docker rm bill-manager` 
3. ✅ **Pull the new image**: `docker pull raishelmy/bill-manager:latest`
4. ✅ **Start the new container** with the same volume mounts
5. ✅ **Verify the update**: Check the application at http://localhost:3000

### Rollback to Previous Version

If you encounter issues with a new version:

```bash
# Stop current container
docker stop bill-manager
docker rm bill-manager

# Run previous stable version
docker run -d \
  --name bill-manager \
  -p 3000:3000 \
  -v bill-manager-data:/app/data \
  -e NEXTAUTH_SECRET=your-production-secret-key-change-this \
  -e NEXTAUTH_URL=http://localhost:3000 \
  raishelmy/bill-manager:v1.6-custom-reference
```

### Backup Before Major Updates

For major version updates, consider backing up your database:

```bash
# Create backup
docker run --rm -v bill-manager-data:/data -v $(pwd):/backup alpine tar czf /backup/bill-manager-backup.tar.gz -C /data .

# Restore backup (if needed)
docker run --rm -v bill-manager-data:/data -v $(pwd):/backup alpine tar xzf /backup/bill-manager-backup.tar.gz -C /data
```

## Support

For issues or questions, please check the application logs:

```bash
# View container logs
docker logs bill-manager

# Follow logs in real-time
docker logs -f bill-manager
```