#!/usr/bin/env bash

apt-get update && apt-get install -y wget gnupg unzip

# Add Chrome repo
wget -q -O - https://dl-ssl.google.com/linux/linux_signing_key.pub | apt-key add -
sh -c 'echo "deb [arch=amd64] http://dl.google.com/linux/chrome/deb/ stable main" > /etc/apt/sources.list.d/google-chrome.list'

# Install stable chrome
apt-get update && apt-get install -y google-chrome-stable

# Proceed with normal Node install
npm install --force
