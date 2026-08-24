# better-sqlite3 ships prebuilt binaries for most platforms, but keeping
# build tools available as a fallback means the image still builds
# correctly on a platform without one (e.g. an less-common arch). This
# stage is discarded below, so none of that tooling ends up in the image
# that actually runs.
FROM node:20-alpine AS builder
WORKDIR /app
RUN apk add --no-cache python3 make g++
COPY package.json ./
RUN npm install --omit=dev

FROM node:20-alpine
WORKDIR /app

COPY --from=builder /app/node_modules ./node_modules
COPY package.json ./
COPY server.js ./
COPY src ./src
COPY public ./public

ENV PORT=3000
ENV DATA_DIR=/app/data

EXPOSE 3000

CMD ["node", "server.js"]
