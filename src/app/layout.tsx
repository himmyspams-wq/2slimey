import type { Metadata } from 'next';
import { Inter, Playfair_Display } from 'next/font/google';
import './globals.css';
import Providers from '@/components/Providers';
import Navbar from '@/components/Navbar';
import Footer from '@/components/Footer';

const inter = Inter({
  subsets: ['latin'],
  variable: '--font-inter',
  display: 'swap',
});

const playfair = Playfair_Display({
  subsets: ['latin'],
  variable: '--font-playfair',
  display: 'swap',
});

export const metadata: Metadata = {
  metadataBase: new URL(process.env.NEXTAUTH_URL || 'http://localhost:3000'),
  title: {
    template: '%s | ReelMarket — Premium Fishing Reel Marketplace',
    default: 'ReelMarket — Premium Fishing Reel Marketplace',
  },
  description:
    'Buy and sell the world\'s finest fishing reels. Peer-to-peer marketplace for premium brands including Shimano, Daiwa, Abel, Hardy, and more.',
  keywords: ['fishing reels', 'used fishing reels', 'buy fishing reels', 'sell fishing reels', 'Shimano', 'Daiwa', 'Abel', 'Hardy'],
  openGraph: {
    type: 'website',
    siteName: 'ReelMarket',
    title: 'ReelMarket — Premium Fishing Reel Marketplace',
    description: 'The premier marketplace for premium fishing reels.',
  },
};

export default function RootLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <html lang="en" className={`${inter.variable} ${playfair.variable}`}>
      <body className="min-h-screen flex flex-col">
        <Providers>
          <Navbar />
          <main className="flex-1">{children}</main>
          <Footer />
        </Providers>
      </body>
    </html>
  );
}
