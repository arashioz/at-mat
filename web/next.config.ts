import type { NextConfig } from 'next';
import { fileURLToPath } from 'node:url';

const config: NextConfig = {
  reactStrictMode: true,
  poweredByHeader: false,
  agentRules: false,
  turbopack: { root: fileURLToPath(new URL('..', import.meta.url)) },
  outputFileTracingRoot: fileURLToPath(new URL('..', import.meta.url)),
  outputFileTracingIncludes: { '/*': ['../assets/image-manifest.json'] },
  async rewrites() {
    const media = (process.env.ATMAT_MEDIA_URL ?? 'http://127.0.0.1:9000/at-mat-assets').replace(/\/$/, '');
    return [
      {
        source: '/media/:path*',
        destination: `${media}/:path*`,
      },
    ];
  },
};

export default config;
