#!/bin/bash
set -e

echo "🚀 Starting Render build process..."

# Update package lists
echo "📦 Updating package lists..."
apt-get update -y

# Install required dependencies
echo "🔧 Installing required dependencies..."
apt-get install -y \
    wget \
    gnupg \
    ca-certificates \
    fonts-liberation \
    libappindicator3-1 \
    libasound2 \
    libatk-bridge2.0-0 \
    libatk1.0-0 \
    libcups2 \
    libdbus-1-3 \
    libdrm2 \
    libgbm1 \
    libgtk-3-0 \
    libnspr4 \
    libnss3 \
    libxcomposite1 \
    libxdamage1 \
    libxfixes3 \
    libxrandr2 \
    libxss1 \
    libxtst6 \
    xdg-utils

# Add Google Chrome repository
echo "🌐 Adding Google Chrome repository..."
wget -q -O - https://dl.google.com/linux/linux_signing_key.pub | apt-key add -
echo "deb [arch=amd64] http://dl.google.com/linux/chrome/deb/ stable main" >> /etc/apt/sources.list.d/google.list

# Update package lists again
echo "📦 Updating package lists with Chrome repository..."
apt-get update -y

# Install Google Chrome
echo "🎯 Installing Google Chrome..."
apt-get install -y google-chrome-stable

# Verify Chrome installation
echo "✅ Verifying Chrome installation..."
google-chrome-stable --version

# Check Chrome executable paths
echo "🔍 Checking Chrome executable paths..."
which google-chrome-stable || echo "google-chrome-stable not in PATH"
which google-chrome || echo "google-chrome not in PATH"
ls -la /usr/bin/google-chrome* || echo "No google-chrome* files in /usr/bin/"

# Install npm dependencies
echo "📦 Installing npm dependencies..."
npm install

# Verify Puppeteer installation
echo "🤖 Verifying Puppeteer installation..."
node -e "const puppeteer = require('puppeteer'); console.log('Puppeteer version:', puppeteer.version || 'unknown');"

echo "✅ Build completed successfully!"
echo "🎉 Chrome and all dependencies are ready!"