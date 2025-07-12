FROM node:20-alpine AS builder

WORKDIR /app/web
COPY web/package*.json ./
RUN npm install
COPY web ./
RUN npm run build

FROM node:20-alpine
WORKDIR /app

COPY package*.json ./
RUN npm install

COPY . .
COPY --from=builder /app/web/build ./web/build

EXPOSE 3000 2525
CMD ["node", "index.js"]
