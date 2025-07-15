#!/usr/bin/env bash
echo "📦 Installing Chromium manually..."
apt-get update && apt-get install -y wget gnupg unzip curl gnupg2

# Add Chrome repo
wget -q -O - https://dl.google.com/linux/linux_signing_key.pub | apt-key add -
echo "deb [arch=amd64] http://dl.google.com/linux/chrome/deb/ stable main" \
  > /etc/apt/sources.list.d/google-chrome.list

apt-get update && apt-get install -y google-chrome-stable

echo "✅ Chrome installed at /usr/bin/google-chrome"

# Install dependencies
npm install --production

echo "✅ Build complete"
