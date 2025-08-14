#!/bin/sh

# Bill Manager Docker Entrypoint Script
# Initializes the database and starts the application

echo "🚀 Starting Bill Manager..."

# Set DATABASE_URL for container environment
export DATABASE_URL="file:/app/data/prod.db"

# Check if database file exists
if [ ! -f "/app/data/prod.db" ]; then
    echo "📊 Database not found. Initializing new database..."
    
    # Create database directory if it doesn't exist
    mkdir -p /app/data
    
    # Initialize database with Prisma
    echo "🔧 Running Prisma database push..."
    npx prisma db push --accept-data-loss
    
    # Generate Prisma client (in case it's needed)
    echo "⚡ Generating Prisma client..."
    npx prisma generate
    
    echo "✅ Database initialized successfully!"
else
    echo "📊 Database found. Checking for schema updates..."
    
    # Run migration to ensure schema is up to date
    npx prisma db push --accept-data-loss
    
    echo "✅ Database schema updated!"
fi

echo "🌟 Starting Next.js application..."

# Start the Next.js application
exec node server.js