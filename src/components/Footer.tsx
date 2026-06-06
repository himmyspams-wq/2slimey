import Link from 'next/link';
import { Fish } from 'lucide-react';
import { ALLOWED_BRANDS } from '@/lib/brands';

export default function Footer() {
  return (
    <footer className="bg-navy-900 text-white">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-14">
        <div className="grid grid-cols-1 md:grid-cols-4 gap-10">
          {/* Brand */}
          <div className="md:col-span-1">
            <div className="flex items-center gap-2 mb-3">
              <Fish className="h-6 w-6 text-gold-400" />
              <span className="font-serif text-xl font-bold text-white">REELMARKET</span>
              <span className="text-gold-400 text-xl font-bold">.</span>
            </div>
            <p className="text-navy-300 text-sm leading-relaxed">
              The premier peer-to-peer marketplace for premium fishing reels. Buy and sell the world&apos;s finest gear.
            </p>
          </div>

          {/* Links */}
          <div>
            <h3 className="text-sm font-semibold text-white uppercase tracking-wider mb-4">Marketplace</h3>
            <ul className="space-y-2">
              {[
                { href: '/listings', label: 'Browse Listings' },
                { href: '/listings/new', label: 'Sell Your Reel' },
                { href: '/messages', label: 'Messages' },
                { href: '/profile', label: 'My Profile' },
              ].map((link) => (
                <li key={link.href}>
                  <Link
                    href={link.href}
                    className="text-navy-300 hover:text-gold-400 text-sm transition-colors"
                  >
                    {link.label}
                  </Link>
                </li>
              ))}
            </ul>
          </div>

          {/* Company */}
          <div>
            <h3 className="text-sm font-semibold text-white uppercase tracking-wider mb-4">Company</h3>
            <ul className="space-y-2">
              {[
                { href: '#', label: 'About Us' },
                { href: '#', label: 'Contact' },
                { href: '#', label: 'Privacy Policy' },
                { href: '#', label: 'Terms of Service' },
              ].map((link) => (
                <li key={link.label}>
                  <Link
                    href={link.href}
                    className="text-navy-300 hover:text-gold-400 text-sm transition-colors"
                  >
                    {link.label}
                  </Link>
                </li>
              ))}
            </ul>
          </div>

          {/* Brands */}
          <div>
            <h3 className="text-sm font-semibold text-white uppercase tracking-wider mb-4">
              Approved Brands
            </h3>
            <div className="flex flex-wrap gap-1.5">
              {ALLOWED_BRANDS.map((brand) => (
                <Link
                  key={brand}
                  href={`/listings?brand=${encodeURIComponent(brand)}`}
                  className="text-xs px-2 py-1 rounded-full bg-navy-800 text-navy-300 hover:bg-gold-600 hover:text-white transition-all"
                >
                  {brand}
                </Link>
              ))}
            </div>
          </div>
        </div>

        <div className="border-t border-navy-800 mt-10 pt-6 flex flex-col sm:flex-row items-center justify-between gap-4">
          <p className="text-navy-400 text-sm">
            &copy; {new Date().getFullYear()} ReelMarket. All rights reserved.
          </p>
          <p className="text-navy-500 text-xs">
            Only premium, top-tier fishing reel brands. No exceptions.
          </p>
        </div>
      </div>
    </footer>
  );
}
