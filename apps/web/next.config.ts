import type { NextConfig } from 'next';

const nextConfig: NextConfig = {
  images: {
    domains: ['ipfs.io', '0g.ai', 'gateway.0g.ai'],
  },
  async headers() {
    return [
      {
        // x402 payment headers — allow payment negotiation
        source: '/api/:path*',
        headers: [
          { key: 'Access-Control-Allow-Origin', value: '*' },
          { key: 'Access-Control-Allow-Methods', value: 'GET, POST, OPTIONS' },
          { key: 'Access-Control-Allow-Headers', value: 'Content-Type, X-PAYMENT, X-PAYMENT-RESPONSE' },
          { key: 'Access-Control-Expose-Headers', value: 'X-PAYMENT-RESPONSE, X-ACCEPTS-PAYMENT' },
        ],
      },
    ];
  },
};

export default nextConfig;
