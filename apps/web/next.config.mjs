import { config as loadEnv } from 'dotenv';
import { resolve, dirname } from 'path';
import { fileURLToPath } from 'url';

const __dirname = dirname(fileURLToPath(import.meta.url));
// Load root .env so Next.js picks up all vars (monorepo setup)
loadEnv({ path: resolve(__dirname, '../../.env'), override: false });

/** @type {import('next').NextConfig} */
const nextConfig = {
  images: {
    domains: ['ipfs.io', '0g.ai', 'gateway.0g.ai', 'images.unsplash.com'],
  },
  webpack: (config) => {
    // Optional deps of @wagmi/connectors not available in this build environment
    config.resolve.alias = {
      ...config.resolve.alias,
      'porto/internal': false,
      'porto': false,
      '@metamask/connect-evm': false,
      'prop-types': resolve(__dirname, '../../node_modules/prop-types'),
    };
    // pino-pretty is an optional dep of WalletConnect — not needed in browser
    config.resolve.fallback = { ...config.resolve.fallback, 'pino-pretty': false };
    return config;
  },
  async headers() {
    return [
      {
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
