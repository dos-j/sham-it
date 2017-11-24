FROM node:8.9.1 AS builder

WORKDIR /usr/src/app
COPY yarn.lock .
COPY package.json .
RUN yarn --production --no-progress && yarn cache clean && rm -rf /tmp/*

FROM node:8.9.1

WORKDIR /usr/src/app
COPY --from=builder /usr/src/app/node_modules node_modules
COPY . .

EXPOSE 80
ENV PORT 80

CMD ["node", "docker-run.js"]
