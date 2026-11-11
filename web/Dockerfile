# Public site (Next.js 16). Build context is the repository root; see compose.apps.yml.
# Next.js rewrites are fixed at build time, so the API/media URLs are build args too.
FROM node:22-bookworm-slim

ARG ATMAT_API_URL=http://backend:3010/api
ARG ATMAT_MEDIA_URL=http://minio:9000/at-mat-assets
ARG NEXT_PUBLIC_SITE_URL
ENV ATMAT_API_URL=${ATMAT_API_URL} \
    ATMAT_MEDIA_URL=${ATMAT_MEDIA_URL} \
    NEXT_PUBLIC_SITE_URL=${NEXT_PUBLIC_SITE_URL} \
    NEXT_TELEMETRY_DISABLED=1

WORKDIR /app/web

# npm ci runs before NODE_ENV is set so devDependencies (TypeScript, types) are installed.
COPY web/package.json web/package-lock.json ./
RUN npm ci

COPY web/ ./
# Shared pure-TS types/copy imported by web/src via ../../backend/src/common and recipes.
# Only these files are needed, so the server code is not copied into the site image.
COPY backend/src/common /app/backend/src/common
COPY backend/src/recipes/recipe.types.ts /app/backend/src/recipes/recipe.types.ts
COPY backend/src/recipes/recipe-publication.ts /app/backend/src/recipes/recipe-publication.ts
# Manifest is read from ../assets at build (tracing) and at runtime.
COPY assets /app/assets
RUN npm run build \
 && chown -R node:node /app

ENV NODE_ENV=production

USER node
EXPOSE 3002

CMD ["node", "node_modules/next/dist/bin/next", "start", "--hostname", "0.0.0.0", "--port", "3002"]
