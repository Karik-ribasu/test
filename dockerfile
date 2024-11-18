
FROM node:21-alpine
WORKDIR /app
COPY package.json yarn.lock ./
RUN yarn install
COPY . .
CMD ["npx", "ts-node", "./src/server.ts"]
EXPOSE 3000