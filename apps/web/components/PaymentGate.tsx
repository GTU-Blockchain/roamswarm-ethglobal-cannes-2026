'use client';

// TODO: x402 micropayment flow component
// - Constructs X-PAYMENT header via buildPaymentHeader() from lib/x402.ts
//   (amount: 0.5 USDC, network: eip155:1, recipient: ESCROW_CONTRACT)
// - POST to /api/experience/[id] with payment header
// - Shows tx status: idle | pending | success | error
// Props: poiId, onSuccess

export interface PaymentGateProps {
  poiId: string;
  onSuccess: () => void;
}

export function PaymentGate({ poiId, onSuccess }: PaymentGateProps) {
  return <></>;
}
