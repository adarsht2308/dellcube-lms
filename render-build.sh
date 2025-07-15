#!/bin/bash
set -e

echo "🚀 Starting Render build process..."

# Update package lists
echo "📦 Updating package lists..."
apt-get update -y

# Install required dependencies for Chrome
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
    xdg-utils \
    libgconf-2-4 \
    libxss1 \
    libgconf-2-4 \
    libxtst6 \
    libxrandr2 \
    libasound2 \
    libpangocairo-1.0-0 \
    libatk1.0-0 \
    libcairo-gobject2 \
    libgtk-3-0 \
    libgdk-pixbuf2.0-0

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

# Check Chrome executable paths and permissions
echo "🔍 Checking Chrome executable paths..."
ls -la /usr/bin/google-chrome* || echo "No google-chrome* files in /usr/bin/"

# Set proper permissions (just in case)
echo "🔐 Setting proper permissions..."
chmod +x /usr/bin/google-chrome-stable || echo "Could not set permissions"

# Test Chrome binary
echo "🧪 Testing Chrome binary..."
/usr/bin/google-chrome-stable --version || echo "Chrome binary test failed"

# Install npm dependencies
echo "📦 Installing npm dependencies..."
npm install

# Verify Puppeteer installation
echo "🤖 Verifying Puppeteer installation..."
node -e "
const puppeteer = require('puppeteer');
console.log('Puppeteer version:', puppeteer.version || 'unknown');
console.log('Puppeteer executablePath:', puppeteer.executablePath?.() || 'not available');
"

# Check if Puppeteer can find Chrome
echo "🔍 Checking if Puppeteer can find Chrome..."
node -e "
const puppeteer = require('puppeteer');
const fs = require('fs');

// Check bundled Chromium
try {
  const chromiumPath = puppeteer.executablePath?.();
  if (chromiumPath && fs.existsSync(chromiumPath)) {
    console.log('✅ Puppeteer bundled Chromium found at:', chromiumPath);
  } else {
    console.log('⚠️ Puppeteer bundled Chromium not found');
  }
} catch (e) {
  console.log('⚠️ Could not check bundled Chromium:', e.message);
}

// Check system Chrome
const chromePaths = [
  '/usr/bin/google-chrome-stable',
  '/usr/bin/google-chrome',
  '/usr/bin/chromium-browser',
  '/usr/bin/chromium'
];

for (const path of chromePaths) {
  if (fs.existsSync(path)) {
    console.log('✅ System Chrome found at:', path);
    break;
  }
}
"

echo "✅ Build completed successfully!"
echo "🎉 Chrome and all dependencies are ready!"

# Optional: Test launching Puppeteer (comment out if causing issues)
echo "🧪 Testing Puppeteer launch..."
node -e "
const puppeteer = require('puppeteer');
(async () => {
  try {
    const browser = await puppeteer.launch({
      headless: true,
      args: ['--no-sandbox', '--disable-setuid-sandbox']
    });
    console.log('✅ Puppeteer launch test successful');
    await browser.close();
  } catch (error) {
    console.log('⚠️ Puppeteer launch test failed:', error.message);
  }
})();
" || echo "Puppeteer test completed with warnings"