FROM node:24-alpine

WORKDIR /app

COPY package.json package-lock.json ./

RUN npm ci --only=production

COPY . .

ENV NODE_ENV=production

EXPOSE 8000

CMD ["node", "src/index.js"]