#!/bin/bash

echo "=== MilaKnight OS - Server Setup ==="

# Pull latest changes
echo "[1/5] Pulling latest changes from GitHub..."
git pull origin main

# Install dependencies
echo "[2/5] Installing dependencies..."
npm install

# Add ANTHROPIC_API_KEY to .env if not already there
if ! grep -q "ANTHROPIC_API_KEY" .env 2>/dev/null; then
  echo "[3/5] Adding ANTHROPIC_API_KEY to .env..."
  read -p "Enter your ANTHROPIC_API_KEY: " API_KEY
  echo "ANTHROPIC_API_KEY=\"$API_KEY\"" >> .env
else
  echo "[3/5] ANTHROPIC_API_KEY already exists in .env, skipping..."
fi

# Run Prisma migration
echo "[4/5] Running database migration..."
npx prisma migrate dev --name add-ai-chat
npx prisma generate

# Build and start
echo "[5/5] Building project..."
npm run build

echo ""
echo "=== Setup Complete! ==="
echo "Run 'npm start' to start the server"
