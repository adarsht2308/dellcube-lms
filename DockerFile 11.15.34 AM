# ---- Base Node image ----
    FROM node:20-slim

    # ---- Install system dependencies for Puppeteer/Chrome ----
    RUN apt-get update && apt-get install -y \
        wget \
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
        libx11-xcb1 \
        libxcomposite1 \
        libxdamage1 \
        libxrandr2 \
        xdg-utils \
        --no-install-recommends && \
        rm -rf /var/lib/apt/lists/*
    
    # ---- Set working directory ----
    WORKDIR /app
    
    # ---- Copy backend files and install server dependencies ----
    COPY package*.json ./
    RUN npm install
    
    # ---- Install Puppeteer Chrome binary (as in render-build.sh) ----
    RUN npx puppeteer browsers install chrome
    
    # ---- Copy backend source ----
    COPY . .
    
    # ---- Build client (Vite) ----
    WORKDIR /app/client
    COPY client/package*.json ./
    RUN npm install
    RUN npm run build
    
    # ---- Return to backend root ----
    WORKDIR /app
    
    # ---- Expose the backend port ----
    EXPOSE 8080
    
    # ---- Start the server ----
    CMD ["npm", "start"]