#!/usr/bin/env bash
set -o errexit

npm install

# Ensure Puppeteer downloads Chromium
npx puppeteer install
