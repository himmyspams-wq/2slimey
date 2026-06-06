import Link from 'next/link';
import { ArrowRight, Shield, MessageSquare, Users, Fish } from 'lucide-react';
import { prisma } from '@/lib/prisma';
import { ALLOWED_BRANDS } from '@/lib/brands';
import ListingCard from '@/components/ListingCard';

async function getLatestListings() {
  try {
    return await prisma.listing.findMany({
      where: { status: 'ACTIVE' },
      orderBy: { createdAt: 'desc' },
      take: 8,
      include: {
        images: {
          orderBy: { order: 'asc' },
          take: 1,
        },
        user: {
          select: {
            id: true,
            name: true,
            image: true,
          },
        },
      },
    });
  } catch {
    return [];
  }
}

export default async function HomePage() {
  const listings = await getLatestListings();

  return (
    <div>
      {/* Hero */}
      <section className="bg-navy-900 text-white relative overflow-hidden">
        <div className="absolute inset-0 opacity-5">
          <div className="absolute inset-0" style={{
            backgroundImage: 'radial-gradient(circle at 20% 50%, #C9A84C 0%, transparent 50%), radial-gradient(circle at 80% 20%, #1E3A5F 0%, transparent 60%)',
          }} />
        </div>
        <div className="relative max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-24 sm:py-32">
          <div className="max-w-3xl">
            <div className="flex items-center gap-2 mb-6">
              <Fish className="h-8 w-8 text-gold-400" />
              <span className="text-gold-400 text-sm font-semibold uppercase tracking-widest">
                Premium Reel Marketplace
              </span>
            </div>
            <h1 className="font-serif text-5xl sm:text-6xl lg:text-7xl font-bold text-white leading-tight mb-6">
              The Premium{' '}
              <span className="text-gold-400">Reel</span>{' '}
              Marketplace
            </h1>
            <p className="text-navy-200 text-lg sm:text-xl leading-relaxed mb-10 max-w-2xl">
              Buy and sell the world&apos;s finest fishing reels. Only the most prestigious brands,
              only the most serious anglers. No compromises.
            </p>
            <div className="flex flex-wrap gap-4">
              <Link href="/listings" className="btn-gold text-base px-8 py-3">
                Browse Listings
                <ArrowRight className="h-5 w-5" />
              </Link>
              <Link href="/listings/new" className="btn-secondary text-base px-8 py-3 border-white text-white hover:bg-white/10">
                Sell Your Reel
              </Link>
            </div>
          </div>
        </div>
      </section>

      {/* Stats Bar */}
      <section className="bg-navy-800 text-white">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-6">
          <div className="grid grid-cols-2 md:grid-cols-4 gap-6">
            {[
              { stat: '19', label: 'Premium Brands', icon: Fish },
              { stat: 'P2P', label: 'Peer-to-Peer', icon: Users },
              { stat: '🔒', label: 'Secure Messaging', icon: MessageSquare },
              { stat: '✓', label: 'Buyer Protection', icon: Shield },
            ].map((item) => (
              <div key={item.label} className="text-center">
                <div className="text-2xl font-bold text-gold-400 mb-1">{item.stat}</div>
                <div className="text-navy-300 text-sm">{item.label}</div>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* Latest Listings */}
      {listings.length > 0 && (
        <section className="page-section">
          <div className="container-main">
            <div className="flex items-center justify-between mb-8">
              <div>
                <h2 className="font-serif text-3xl font-bold text-navy-800">Latest Listings</h2>
                <p className="text-navy-500 mt-1">Fresh reels from serious anglers</p>
              </div>
              <Link
                href="/listings"
                className="flex items-center gap-1 text-navy-600 hover:text-navy-800 text-sm font-medium transition-colors"
              >
                View all
                <ArrowRight className="h-4 w-4" />
              </Link>
            </div>

            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-6">
              {listings.map((listing) => (
                <ListingCard
                  key={listing.id}
                  listing={{
                    ...listing,
                    price: listing.price.toString(),
                  }}
                />
              ))}
            </div>

            <div className="text-center mt-10">
              <Link href="/listings" className="btn-primary text-base px-8 py-3">
                View All Listings
                <ArrowRight className="h-5 w-5" />
              </Link>
            </div>
          </div>
        </section>
      )}

      {/* How It Works */}
      <section className="page-section bg-navy-50">
        <div className="container-main">
          <div className="text-center mb-12">
            <h2 className="font-serif text-3xl font-bold text-navy-800">How It Works</h2>
            <p className="text-navy-500 mt-2">Simple. Secure. Premium.</p>
          </div>
          <div className="grid grid-cols-1 md:grid-cols-3 gap-8">
            {[
              {
                step: '01',
                title: 'Create Account',
                description:
                  'Sign up in seconds with your email. No fees, no subscriptions — free to join.',
              },
              {
                step: '02',
                title: 'List Your Reel',
                description:
                  'Take photos, set your price, describe the condition. Go live in minutes.',
              },
              {
                step: '03',
                title: 'Connect & Sell',
                description:
                  'Buyers message you directly. Negotiate, agree, and complete the deal.',
              },
            ].map((item) => (
              <div key={item.step} className="card p-8 text-center">
                <div className="text-5xl font-serif font-bold text-gold-500 mb-4">{item.step}</div>
                <h3 className="font-semibold text-navy-800 text-lg mb-2">{item.title}</h3>
                <p className="text-navy-500 text-sm leading-relaxed">{item.description}</p>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* Brand Showcase */}
      <section className="page-section">
        <div className="container-main">
          <div className="text-center mb-8">
            <h2 className="font-serif text-3xl font-bold text-navy-800">Approved Brands</h2>
            <p className="text-navy-500 mt-2">
              Only the world&apos;s finest manufacturers. No exceptions.
            </p>
          </div>
          <div className="flex flex-wrap justify-center gap-3">
            {ALLOWED_BRANDS.map((brand) => (
              <Link
                key={brand}
                href={`/listings?brand=${encodeURIComponent(brand)}`}
                className="px-4 py-2 rounded-full bg-white border border-cream-300 text-navy-700 text-sm font-medium hover:bg-navy-700 hover:text-white hover:border-navy-700 transition-all shadow-sm"
              >
                {brand}
              </Link>
            ))}
          </div>
        </div>
      </section>

      {/* CTA Banner */}
      <section className="bg-navy-800 py-16">
        <div className="container-main text-center">
          <h2 className="font-serif text-3xl sm:text-4xl font-bold text-white mb-4">
            Ready to find your next reel?
          </h2>
          <p className="text-navy-300 text-lg mb-8 max-w-xl mx-auto">
            Join thousands of anglers buying and selling premium fishing reels on 2Slimey.
          </p>
          <div className="flex flex-wrap gap-4 justify-center">
            <Link href="/auth/register" className="btn-gold text-base px-8 py-3">
              Create Free Account
              <ArrowRight className="h-5 w-5" />
            </Link>
            <Link href="/listings" className="text-white border-2 border-white/30 hover:border-white inline-flex items-center gap-2 px-8 py-3 rounded-lg text-base font-medium transition-all">
              Browse Listings
            </Link>
          </div>
        </div>
      </section>
    </div>
  );
}
