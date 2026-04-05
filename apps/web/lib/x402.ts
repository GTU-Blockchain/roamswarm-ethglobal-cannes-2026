// x402 micropayment protocol — Ethereum Sepolia (eip155:11155111)
// Spec: https://x402.org
// Header format: X-PAYMENT: <base64(JSON payload)>

export interface PaymentConfig {
  amount: string;          // e.g. "0.5"
  token: 'ETH' | 'USDC';
  network: 'eip155:11155111';
  recipient: string;       // escrow contract address
  poiId: string;           // hex bytes32
}

export interface X402Payload {
  scheme:    'exact';
  network:   string;
  payload: {
    version:   number;
    scheme:    'exact';
    network:   string;
    token:     string;       // ETH address or USDC address
    maxAmount: string;       // amount in smallest unit (wei / uUSDC)
    extra: {
      name:   string;
      value:  string;
    }[];
  };
}

// USDC on Sepolia (Circle testnet)
const USDC_SEPOLIA = '0x1c7D4B196Cb0C7B01d743Fbc6116a902379C7238';
const ETH_ADDRESS  = '0xEeeeeEeeeEeEeeEeEeEeeEEEeeeeEeeeeeeeEEeE'; // canonical ETH placeholder

export function buildPaymentHeader(config: PaymentConfig): string {
  const isETH  = config.token === 'ETH';
  const token  = isETH ? ETH_ADDRESS : USDC_SEPOLIA;
  // ETH: wei (18 decimals); USDC: μUSDC (6 decimals)
  const amount = isETH
    ? BigInt(Math.round(parseFloat(config.amount) * 1e18)).toString()
    : BigInt(Math.round(parseFloat(config.amount) * 1e6)).toString();

  const payload: X402Payload = {
    scheme:  'exact',
    network: config.network,
    payload: {
      version:   1,
      scheme:    'exact',
      network:   config.network,
      token,
      maxAmount: amount,
      extra: [
        { name: 'recipient', value: config.recipient },
        { name: 'poiId',     value: config.poiId },
      ],
    },
  };

  return btoa(JSON.stringify(payload));
}

export async function fetchWithPayment(url: string, config: PaymentConfig): Promise<Response> {
  return fetch(url, {
    headers: { 'X-PAYMENT': buildPaymentHeader(config) },
  });
}
