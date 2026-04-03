import type { Metadata } from 'next';
import { Inter } from 'next/font/google';
import { WalletProvider } from '@/components/WalletProvider';
import './globals.css';

const inter = Inter({ subsets: ['latin'] });

export const metadata: Metadata = {
  title: 'Roam-Swarm — AI-Powered Urban Discovery',
  description: 'Cities alive through stories. Explore Cannes with AI-powered audio experiences.',
  manifest: '/manifest.json',
  themeColor: '#0A0A0F',
  appleWebApp: {
    capable: true,
    statusBarStyle: 'black-translucent',
    title: 'Roam Swarm',
  },
  viewport: {
    width: 'device-width',
    initialScale: 1,
    maximumScale: 1,
  },
};

export default function RootLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <html lang="en" className="dark">
      <body
        className={`${inter.className} bg-roam-dark text-white min-h-screen antialiased`}
      >
        <WalletProvider>{children}</WalletProvider>
      </body>
    </html>
  );
}
