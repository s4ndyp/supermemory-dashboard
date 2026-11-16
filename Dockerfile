# Build de statische Supermemory-dashboard SPA en serveer hem met nginx.
# nginx proxyt /api/* door naar de self-hosted supermemory-instance
# (de binary stuurt geen CORS-headers, dus alles moet same-origin lopen).

FROM oven/bun:1 AS build
WORKDIR /app
COPY package.json bun.lock ./
RUN bun install --frozen-lockfile
COPY . .
RUN bun run build

FROM nginx:alpine
# Eigen server-config; de upstream komt uit SUPERMEMORY_UPSTREAM (zie nginx.conf.template)
COPY nginx.conf.template /etc/nginx/templates/default.conf.template
COPY --from=build /app/dist /usr/share/nginx/html
# Standaard-upstream; in de compose overschreven per omgeving
ENV SUPERMEMORY_UPSTREAM=http://10.5.0.157:6767
EXPOSE 80
