import type { NextConfig } from 'next';
import { fileURLToPath } from 'node:url';

const config: NextConfig = {
  reactStrictMode: true,
  poweredByHeader: false,
  devIndicators: false,
  agentRules: false,
  turbopack: { root: fileURLToPath(new URL('..', import.meta.url)) },
  outputFileTracingRoot: fileURLToPath(new URL('..', import.meta.url)),
  outputFileTracingIncludes: { '/*': ['../assets/image-manifest.json'] },
  async rewrites() {
    const media = (process.env.ATMAT_MEDIA_URL ?? 'http://127.0.0.1:9000/at-mat-assets').replace(/\/$/, '');
    const api = (process.env.ATMAT_API_URL ?? 'http://127.0.0.1:3010/api').replace(/\/$/, '');
    return [
      { source: '/api/collaboration', destination: `${api}/public/collaboration` },
      { source: '/api/recipes/:slug/comments', destination: `${api}/public/recipes/:slug/comments` },
      {
        source: '/media/:path*',
        destination: `${media}/:path*`,
      },
    ];
  },
};

export default config;
