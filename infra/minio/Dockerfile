# Match the source revision used by the original asset environment.
# Build context is only infra/minio; application assets and env files are excluded.
FROM golang:1.24.8-alpine3.22 AS build
RUN apk add --no-cache git ca-certificates
WORKDIR /src
RUN git init . \
 && git remote add origin https://github.com/minio/minio.git \
 && git fetch --depth 1 origin 7aac2a2c5b7c882e68c1ce017d8256be2feea27f \
 && git checkout --detach FETCH_HEAD
# A pipe also falls back after HTTP 403; Go's comma default only handles 404/410.
ARG GOPROXY="https://proxy.golang.org|https://goproxy.cn|direct"
RUN --mount=type=cache,target=/go/pkg/mod \
    --mount=type=cache,target=/root/.cache/go-build \
    CGO_ENABLED=0 GOPROXY="${GOPROXY}" go build -p 2 -trimpath -o /out/minio .

FROM debian:bookworm-slim
RUN apt-get update \
 && apt-get install -y --no-install-recommends ca-certificates curl \
 && rm -rf /var/lib/apt/lists/*
LABEL org.opencontainers.image.source="https://github.com/minio/minio" \
      org.opencontainers.image.revision="7aac2a2c5b7c882e68c1ce017d8256be2feea27f" \
      org.opencontainers.image.licenses="AGPL-3.0-only"
COPY --from=build /out/minio /usr/local/bin/minio
ENTRYPOINT ["/usr/local/bin/minio"]
