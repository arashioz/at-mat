# Admin panel (Next.js 14). Build context is the repository root; see compose.apps.yml.
# Next.js rewrites are fixed at build time, so the API URL is a build arg too.
FROM node:22-bookworm-slim

ARG ATMAT_API_URL=http://backend:3010/api
ARG ATMAT_MEDIA_URL=http://minio:9000/at-mat-assets
ARG NEXT_PUBLIC_API_URL=/api
ARG NEXT_PUBLIC_SITE_URL
ENV ATMAT_API_URL=${ATMAT_API_URL} \
    ATMAT_MEDIA_URL=${ATMAT_MEDIA_URL} \
    NEXT_PUBLIC_API_URL=${NEXT_PUBLIC_API_URL} \
    NEXT_PUBLIC_SITE_URL=${NEXT_PUBLIC_SITE_URL} \
    NEXT_TELEMETRY_DISABLED=1

WORKDIR /app/admin-web

# npm ci runs before NODE_ENV is set so devDependencies (TypeScript, Tailwind) are installed.
COPY admin-web/package.json admin-web/package-lock.json ./
RUN npm ci

COPY admin-web/ ./
# admin-web imports shared code, styles and fonts from the sibling web/ and backend/ trees:
# web/src/{features/editorial,features/brine,features/articles,styles,fonts} and
# backend/src/{common,recipes}. The context root is required for those relative imports.
COPY backend/src/common /app/backend/src/common
COPY backend/src/recipes/recipe.types.ts /app/backend/src/recipes/recipe.types.ts
COPY backend/src/recipes/recipe-publication.ts /app/backend/src/recipes/recipe-publication.ts
COPY web/src /app/web/src
RUN npm run build \
 && chown -R node:node /app

ENV NODE_ENV=production

USER node
EXPOSE 3001

CMD ["node", "node_modules/next/dist/bin/next", "start", "--hostname", "0.0.0.0", "--port", "3001"]
