# Backend (NestJS). Build context is the repository root; see compose.apps.yml.
FROM node:22-bookworm-slim

WORKDIR /app/backend

COPY backend/package.json backend/package-lock.json ./
RUN npm ci

COPY backend/ ./
RUN npm run build \
 && npm prune --omit=dev \
 && npm cache clean --force \
 && chown -R node:node /app

ENV NODE_ENV=production \
    NPM_CONFIG_UPDATE_NOTIFIER=false

USER node
EXPOSE 3010

HEALTHCHECK --interval=10s --timeout=5s --start-period=30s --retries=12 \
  CMD node -e "fetch('http://127.0.0.1:3010/api/health').then(r => process.exit(r.ok ? 0 : 1)).catch(() => process.exit(1))"

CMD ["node", "dist/main.js"]
