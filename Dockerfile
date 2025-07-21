# ---- Base Node image ----
FROM node:20-slim

WORKDIR /app

COPY package*.json ./
RUN npm install --only=production

COPY . .


WORKDIR /app/client
COPY client/package*.json ./
RUN npm install
RUN npm run build

WORKDIR /app

EXPOSE 8080

CMD ["npm", "start"]