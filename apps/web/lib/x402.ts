// x402 micropayment protocol — Ethereum Sepolia (eip155:11155111)

export interface PaymentConfig {
  amount: string;          // e.g. "0.5"
  token: 'USDC';
  network: 'eip155:11155111';
  recipient: string;       // escrow contract address
}

export function buildPaymentHeader(config: PaymentConfig): string {
  // TODO: implement x402 payment header construction
  return JSON.stringify(config);
}

export async function fetchWithPayment(url: string, config: PaymentConfig): Promise<Response> {
  return fetch(url, {
    headers: { 'X-PAYMENT': buildPaymentHeader(config) },
  });
}
