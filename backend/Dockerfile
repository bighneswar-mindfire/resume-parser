
#deps
FROM node:22-slim AS deps
WORKDIR /app
COPY package.json package-lock.json tsconfig.base.json ./
COPY backend/package.json backend/
RUN npm ci --workspace backend --include-workspace-root=false --ignore-scripts

#build
FROM deps AS build
COPY backend/tsconfig.json backend/
COPY backend/src backend/src
RUN npx tsc -p backend/tsconfig.json

#base runtime
FROM node:22-slim AS runtime
WORKDIR /app
ENV NODE_ENV=production
COPY --from=deps /app/node_modules ./node_modules
COPY backend/package.json ./
COPY --from=build /app/backend/dist ./dist

#api
FROM runtime AS api
ENV WORKERS_ENABLED=false
EXPOSE 5000
CMD ["node", "dist/index.js"]

#worker
FROM runtime AS worker
RUN apt-get update \
    && apt-get install -y --no-install-recommends tesseract-ocr tesseract-ocr-eng \
    && rm -rf /var/lib/apt/lists/*
CMD ["node", "dist/worker.js"]
