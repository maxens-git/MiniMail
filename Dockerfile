FROM node:20-alpine

WORKDIR /app

COPY package*.json ./
COPY inboxStore.js index.js ./
RUN npm install

COPY web ./web
WORKDIR /app/web
RUN npm install && npm run build

WORKDIR /app

EXPOSE 3000 2525

CMD ["node", "index.js"]
