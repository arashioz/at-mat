/** @type {import('next').NextConfig} */
const nextConfig = {
  reactStrictMode: true,
  async rewrites() {
    const api = (process.env.ATMAT_API_URL ?? 'http://127.0.0.1:3010/api').replace(/\/$/, '');
    return [{ source: '/api/:path*', destination: `${api}/:path*` }];
  },
};

export default nextConfig;
