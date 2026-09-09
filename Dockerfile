FROM node:22-alpine AS build

WORKDIR /app
COPY server/package*.json ./server/
COPY client/package*.json ./client/
RUN npm --prefix server ci --no-audit --no-fund
RUN npm --prefix client ci --no-audit --no-fund

COPY server ./server
COPY client ./client
RUN npm --prefix server run build && npm --prefix client run build

FROM node:22-alpine AS runtime

ENV NODE_ENV=production
WORKDIR /app

COPY server/package*.json ./server/
RUN npm --prefix server ci --omit=dev --no-audit --no-fund

COPY --from=build /app/server/dist ./server/dist
COPY server/db ./server/db
COPY server/src/db/seed ./server/dist/db/seed
COPY --from=build /app/client/dist ./client/dist
COPY VisualVelocity/input/articles ./VisualVelocity/input/articles
COPY VisualVelocity/input/q_data ./VisualVelocity/input/q_data
RUN mkdir -p /app/server/data/db && chown -R node:node /app/server/data

WORKDIR /app/server
USER node
CMD ["node", "dist/index.js"]
