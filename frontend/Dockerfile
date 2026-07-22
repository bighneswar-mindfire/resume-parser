# syntax=docker/dockerfile:1.7

#dep
FROM node:22-slim AS deps
WORKDIR /app
COPY package.json package-lock.json tsconfig.base.json ./
COPY frontend/package.json frontend/
RUN npm ci --workspace frontend --include-workspace-root=true --ignore-scripts

#build
FROM deps AS build
WORKDIR /app
COPY frontend/tsconfig.json frontend/
COPY frontend/vite.config.ts frontend/
COPY frontend/index.html frontend/
COPY frontend/public frontend/public
COPY frontend/src frontend/src
RUN npm run build --workspace frontend

#runtime
FROM nginx:1.27-alpine AS runtime
COPY frontend/nginx.conf /etc/nginx/conf.d/default.conf
COPY --from=build /app/frontend/dist /usr/share/nginx/html
EXPOSE 80
HEALTHCHECK --interval=30s --timeout=5s --start-period=10s --retries=3 \
    CMD wget -qO- http://127.0.0.1/ >/dev/null 2>&1 || exit 1
CMD ["nginx", "-g", "daemon off;"]
