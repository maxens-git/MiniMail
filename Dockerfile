FROM node:20-alpine

WORKDIR /app

COPY . .

RUN npm install

WORKDIR /app/frontend
RUN npm install && npm run build

WORKDIR /app

RUN mkdir -p public && cp -r frontend/build/* public/

EXPOSE 3000 2525

CMD ["node", "index.js"]
