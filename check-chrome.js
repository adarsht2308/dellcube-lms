import fs from 'fs';
import { execSync } from 'child_process';

console.log('🔍 Checking Chrome installation...');

// Check if we're in production
const isProduction = process.env.NODE_ENV === 'production';

if (isProduction) {
  console.log('Production environment detected');
  
  // Try to find Chrome
  const chromePaths = [
    '/usr/bin/google-chrome',
    '/usr/bin/google-chrome-stable',
    '/usr/bin/chromium',
    '/usr/bin/chromium-browser',
    '/opt/google/chrome/chrome'
  ];
  
  let chromeFound = false;
  for (const path of chromePaths) {
    if (fs.existsSync(path)) {
      console.log(`✅ Found Chrome at: ${path}`);
      chromeFound = true;
      break;
    }
  }
  
  if (!chromeFound) {
    console.log('❌ Chrome not found, installing...');
    try {
      // Install Chrome
      execSync('apt-get update && apt-get install -y wget gnupg unzip curl', { stdio: 'inherit' });
      execSync('wget -q -O - https://dl.google.com/linux/linux_signing_key.pub | apt-key add -', { stdio: 'inherit' });
      execSync('echo "deb [arch=amd64] http://dl.google.com/linux/chrome/deb/ stable main" > /etc/apt/sources.list.d/google-chrome.list', { stdio: 'inherit' });
      execSync('apt-get update && apt-get install -y google-chrome-stable', { stdio: 'inherit' });
      console.log('✅ Chrome installed successfully');
    } catch (error) {
      console.error('❌ Failed to install Chrome:', error.message);
      console.log('🔄 Falling back to Puppeteer bundled Chromium...');
      
      // Allow Puppeteer to download Chromium as fallback
      try {
        const puppeteer = await import('puppeteer');
        const executablePath = puppeteer.default.executablePath();
        console.log(`✅ Puppeteer Chromium available at: ${executablePath}`);
      } catch (e) {
        console.error('❌ Puppeteer Chromium also not available:', e.message);
      }
    }
  }
} else {
  console.log('Development environment, skipping Chrome check');
}

console.log('✅ Chrome check complete');