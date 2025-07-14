#!/usr/bin/env bash

echo "Installing Chromium in .cache/puppeteer..."

mkdir -p .cache/puppeteer

# Skip default Chromium install and install it manually into a known path
PUPPETEER_SKIP_CHROMIUM_DOWNLOAD=true npx puppeteer install --path .cache/puppeteer

echo "Chromium installed in .cache/puppeteer"
