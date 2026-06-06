import { notFound } from 'next/navigation';
import Link from 'next/link';
import { getServerSession } from 'next-auth';
import {
  MapPin, Truck, Eye, Clock, Flag, CheckCircle, Package,
  MessageSquare, CreditCard, Edit, Trash2
} from 'lucide-react';
import { authOptions } from '@/lib/auth';
import { prisma } from '@/lib/prisma';
import { formatPrice, formatRelativeTime, getConditionLabel } from '@/lib/utils';
import ImageGallery from '@/components/ImageGallery';
import SellerCard from '@/components/SellerCard';
import BrandBadge from '@/components/BrandBadge';
import ConditionBadge from '@/components/ConditionBadge';
import DeleteListingButton from './DeleteListingButton';

export const dynamic = 'force-dynamic';

interface ListingDetailPageProps {
  params: { id: string };
}

async function getListing(id: string) {
  try {
    const listing = await prisma.listing.findUnique({
      where: { id },
      include: {
        images: { orderBy: { order: 'asc' } },
        user: {
          select: {
            id: true,
            name: true,
            image: true,
            isVerified: true,
            createdAt: true,
            location: true,
          },
        },
        _count: {
          select: { conversations: true },
        },
      },
    });

    if (listing) {
      // Increment view count asynchronously
      prisma.listing.update({
        where: { id },
        data: { viewCount: { increment: 1 } },
      }).catch(() => {});
    }

    return listing;
  } catch {
    return null;
  }
}

export default async function ListingDetailPage({ params }: ListingDetailPageProps) {
  const [listing, session] = await Promise.all([
    getListing(params.id),
    getServerSession(authOptions),
  ]);

  if (!listing) {
    notFound();
  }

  const isOwner = session?.user?.id === listing.userId;
  const isAdmin = session?.user?.isAdmin;
  const canEdit = isOwner || isAdmin;
  const isSold = listing.status === 'SOLD';
  const isRemoved = listing.status === 'REMOVED';
  const conditionInfo = getConditionLabel(listing.condition);

  return (
    <div className="container-main py-8 max-w-6xl">
      {/* Breadcrumb */}
      <nav className="text-sm text-navy-400 mb-6">
        <Link href="/" className="hover:text-navy-600">Home</Link>
        <span className="mx-2">/</span>
        <Link href="/listings" className="hover:text-navy-600">Browse</Link>
        <span className="mx-2">/</span>
        <span className="text-navy-700 truncate">{listing.title}</span>
      </nav>

      {/* Removed notice */}
      {isRemoved && (
        <div className="bg-red-50 border border-red-200 rounded-xl p-4 mb-6">
          <p className="text-red-700 font-medium">This listing has been removed.</p>
        </div>
      )}

      <div className="grid grid-cols-1 lg:grid-cols-5 gap-8">
        {/* Left: Images + Details */}
        <div className="lg:col-span-3 space-y-6">
          {/* Image Gallery */}
          <div className="relative">
            <ImageGallery
              images={listing.images.map((img) => ({ url: img.url, alt: listing.title }))}
              title={listing.title}
            />
            {isSold && (
              <div className="absolute inset-0 bg-navy-900/60 rounded-xl flex items-center justify-center">
                <span className="bg-red-600 text-white font-bold text-3xl px-8 py-3 rounded-xl transform -rotate-6 shadow-xl">
                  SOLD
                </span>
              </div>
            )}
          </div>

          {/* Listing Info */}
          <div className="card p-6">
            <div className="flex flex-wrap items-start gap-2 mb-4">
              <BrandBadge brand={listing.brand} />
              <ConditionBadge condition={listing.condition} />
              {isSold && (
                <span className="badge-condition text-xs font-semibold bg-red-100 text-red-700">
                  SOLD
                </span>
              )}
            </div>

            <h1 className="font-serif text-2xl font-bold text-navy-800 mb-1">{listing.title}</h1>
            <p className="text-navy-500 text-sm mb-4">Model: {listing.model}</p>

            {/* Stats row */}
            <div className="flex flex-wrap gap-4 text-sm text-navy-500 border-t border-cream-200 pt-4">
              <div className="flex items-center gap-1">
                <Eye className="h-4 w-4" />
                <span>{listing.viewCount} views</span>
              </div>
              <div className="flex items-center gap-1">
                <Clock className="h-4 w-4" />
                <span>{formatRelativeTime(listing.createdAt)}</span>
              </div>
              <div className="flex items-center gap-1">
                <MapPin className="h-4 w-4" />
                <span>{listing.location}</span>
              </div>
              {listing.shippingAvailable && (
                <div className="flex items-center gap-1 text-emerald-600">
                  <Truck className="h-4 w-4" />
                  <span>
                    Ships nationwide
                    {listing.shippingCost && listing.shippingCost.toNumber() > 0
                      ? ` (+${formatPrice(listing.shippingCost.toNumber())} shipping)`
                      : ' (free shipping)'}
                  </span>
                </div>
              )}
            </div>
          </div>

          {/* Condition Description */}
          {listing.conditionDescription && (
            <div className="card p-6">
              <h2 className="font-semibold text-navy-800 mb-2 flex items-center gap-2">
                <Package className="h-4 w-4 text-navy-600" />
                Condition Notes
              </h2>
              <div className={`inline-flex items-center gap-1 text-xs font-semibold px-2 py-1 rounded-full mb-3 ${conditionInfo.colorClass}`}>
                {conditionInfo.label} ({listing.condition}/10)
              </div>
              <p className="text-navy-600 text-sm leading-relaxed">{listing.conditionDescription}</p>
            </div>
          )}

          {/* Description */}
          {listing.description && (
            <div className="card p-6">
              <h2 className="font-semibold text-navy-800 mb-3">Description</h2>
              <p className="text-navy-600 text-sm leading-relaxed whitespace-pre-line">
                {listing.description}
              </p>
            </div>
          )}
        </div>

        {/* Right: Price Card + Seller */}
        <div className="lg:col-span-2 space-y-4">
          {/* Price Card */}
          <div className="card p-6">
            <div className="mb-4">
              <p className="text-3xl font-bold text-navy-800">
                {formatPrice(listing.price.toNumber())}
              </p>
              {listing.shippingAvailable && listing.shippingCost && listing.shippingCost.toNumber() > 0 && (
                <p className="text-sm text-navy-500 mt-1">
                  +{formatPrice(listing.shippingCost.toNumber())} shipping
                </p>
              )}
            </div>

            {!isSold && !isRemoved && session && !isOwner && (
              <div className="space-y-2">
                <Link
                  href={`/messages/new?listing=${listing.id}&seller=${listing.userId}`}
                  className="btn-primary w-full justify-center py-3"
                >
                  <MessageSquare className="h-5 w-5" />
                  Message Seller
                </Link>
                <button
                  className="btn-secondary w-full py-3 opacity-60 cursor-not-allowed"
                  disabled
                  title="Payment coming soon"
                >
                  <CreditCard className="h-5 w-5" />
                  Buy Now (Coming Soon)
                </button>
              </div>
            )}

            {!session && !isSold && (
              <Link href={`/auth/signin?callbackUrl=/listings/${listing.id}`} className="btn-primary w-full justify-center py-3">
                Sign In to Contact Seller
              </Link>
            )}

            {isSold && (
              <div className="flex items-center gap-2 p-3 bg-red-50 rounded-lg">
                <CheckCircle className="h-5 w-5 text-red-600" />
                <span className="text-red-700 font-medium text-sm">This reel has been sold</span>
              </div>
            )}

            {/* Owner Controls */}
            {canEdit && (
              <div className="mt-4 pt-4 border-t border-cream-200 space-y-2">
                <p className="text-xs font-semibold text-navy-500 uppercase tracking-wider mb-2">
                  Listing Actions
                </p>
                <Link
                  href={`/listings/${listing.id}/edit`}
                  className="btn-secondary w-full justify-center py-2 text-sm"
                >
                  <Edit className="h-4 w-4" />
                  Edit Listing
                </Link>
                {!isSold && isOwner && (
                  <form action={`/api/listings/${listing.id}/sold`} method="POST">
                    <button
                      type="submit"
                      className="w-full py-2 px-4 rounded-lg border-2 border-emerald-600 text-emerald-700 text-sm font-medium hover:bg-emerald-50 transition-all flex items-center justify-center gap-2"
                    >
                      <CheckCircle className="h-4 w-4" />
                      Mark as Sold
                    </button>
                  </form>
                )}
                <DeleteListingButton listingId={listing.id} />
              </div>
            )}
          </div>

          {/* Seller Card */}
          <SellerCard user={listing.user} />

          {/* Report Link */}
          {session && !isOwner && (
            <div className="text-center">
              <Link
                href={`/listings/${listing.id}/report`}
                className="flex items-center justify-center gap-1.5 text-xs text-navy-400 hover:text-red-600 transition-colors"
              >
                <Flag className="h-3 w-3" />
                Report this listing
              </Link>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
