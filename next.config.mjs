/** @type {import('next').NextConfig} */
const nextConfig = {
  images: {
    unoptimized: true,
  },
  experimental: {
    serverActions: {
      bodySizeLimit: '2mb',
    },
  },
  async headers() {
    return [
      {
        source: '/:path*',
        headers: [
          {
            key: 'Content-Security-Policy',
            value: [
              "default-src 'self'",
              "script-src 'self' 'unsafe-inline' https://app.sandbox.midtrans.com https://app.sandbox.midtrans.com/snap https://staging.midtrans.com https://www.midtrans.com https://docs.midtrans.com https://www.googletagmanager.com https://www.google-analytics.com https://analytics.google.com",
              "script-src-elem 'self' 'unsafe-inline' https://app.sandbox.midtrans.com https://app.sandbox.midtrans.com/snap",
              "style-src 'self' 'unsafe-inline'",
              "style-src-elem 'self' 'unsafe-inline'",
              "img-src 'self' data: https:",
              "font-src 'self' data:",
              "connect-src 'self' https://bcmcubsthnqtzfamkhdy.supabase.co https://api.sandbox.midtrans.com https://app.sandbox.midtrans.com https://ws.sandbox.midtrans.com",
              "frame-src 'self' https://app.sandbox.midtrans.com https://app.sandbox.midtrans.com/snap",
              "frame-ancestors 'none'",
              "base-uri 'self'",
              "form-action 'self'",
              "object-src 'none'",
              "upgrade-insecure-requests",
            ].join('; '),
          },
        ],
      },
    ];
  },
};

export default nextConfig;
