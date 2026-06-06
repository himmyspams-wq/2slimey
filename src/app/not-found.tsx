import Link from 'next/link';
import { Fish } from 'lucide-react';

export default function NotFound() {
  return (
    <div className="min-h-[60vh] flex items-center justify-center px-4">
      <div className="text-center">
        <div className="flex items-center justify-center mb-6">
          <Fish className="h-16 w-16 text-navy-300" />
        </div>
        <h1 className="font-serif text-6xl font-bold text-navy-800 mb-2">404</h1>
        <h2 className="font-serif text-2xl font-bold text-navy-600 mb-4">
          That reel got away
        </h2>
        <p className="text-navy-400 mb-8 max-w-md">
          The page you&apos;re looking for doesn&apos;t exist or has been removed.
        </p>
        <div className="flex gap-4 justify-center">
          <Link href="/" className="btn-primary">
            Go Home
          </Link>
          <Link href="/listings" className="btn-secondary">
            Browse Listings
          </Link>
        </div>
      </div>
    </div>
  );
}
