'use client';

// TODO: Points balance widget (generate via 21st.dev Magic MCP)
// /ui Create a points balance widget with animated counter, daily rate display,
//     and "Free Unlock Available" state with gold highlight when balance >= 500 pts.
// Props: userAddress → reads balance from RoamPoints contract via lib/points.ts

export interface PointsBalanceProps {
  userAddress: string;
}

export function PointsBalance({ userAddress }: PointsBalanceProps) {
  return <></>;
}
