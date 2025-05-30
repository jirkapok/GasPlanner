FROM node:20.11.1 AS builder

WORKDIR /app
COPY .npmrc package.json package-lock.json ./
RUN npm ci

COPY . ./

RUN npm run build-lib \
    && npm run build

FROM node:20.11.1
WORKDIR /app

RUN npm install http-server

COPY --from=builder /app/dist ./dist

EXPOSE 9090
USER node

CMD [ "npx", "http-server", "-p", "9090", "-c-1", "dist/planner" ]
