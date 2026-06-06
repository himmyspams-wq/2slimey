import Image from 'next/image';
import Link from 'next/link';
import { MapPin, Truck, Clock } from 'lucide-react';
import { formatPrice, formatRelativeTime, getInitials } from '@/lib/utils';
import BrandBadge from './BrandBadge';
import ConditionBadge from './ConditionBadge';

interface ListingCardProps {
  listing: {
    id: string;
    title: string;
    brand: string;
    model: string;
    condition: number;
    price: string | number;
    location: string;
    shippingAvailable: boolean;
    status: string;
    createdAt: Date | string;
    images: Array<{ url: string; order: number }>;
    user: {
      id: string;
      name?: string | null;
      image?: string | null;
    };
  };
}

export default function ListingCard({ listing }: ListingCardProps) {
  const firstImage = listing.images.sort((a, b) => a.order - b.order)[0];
  const isSold = listing.status === 'SOLD';
  const displayName = listing.user.name || 'Seller';

  return (
    <Link href={`/listings/${listing.id}`} className="group block">
      <div className="card overflow-hidden hover:shadow-md transition-all duration-200 h-full flex flex-col">
        {/* Image */}
        <div className="relative aspect-listing overflow-hidden bg-cream-100">
          {firstImage ? (
            <Image
              src={firstImage.url}
              alt={listing.title}
              fill
              className="object-cover group-hover:scale-105 transition-transform duration-300"
              sizes="(max-width: 640px) 100vw, (max-width: 1024px) 50vw, 25vw"
            />
          ) : (
            <div className="w-full h-full flex items-center justify-center">
              <div className="text-center text-navy-300">
                <div className="text-4xl mb-2">🎣</div>
                <p className="text-xs">No image</p>
              </div>
            </div>
          )}

          {/* Sold overlay */}
          {isSold && (
            <div className="absolute inset-0 bg-navy-900/70 flex items-center justify-center">
              <span className="bg-red-600 text-white font-bold text-xl px-6 py-2 rounded-lg transform -rotate-6 shadow-lg">
                SOLD
              </span>
            </div>
          )}

          {/* Brand badge overlay */}
          <div className="absolute top-2 left-2">
            <BrandBadge brand={listing.brand} />
          </div>
        </div>

        {/* Content */}
        <div className="p-4 flex flex-col flex-1">
          {/* Title & Condition */}
          <div className="flex items-start justify-between gap-2 mb-2">
            <h3 className="font-semibold text-navy-800 text-sm leading-tight line-clamp-2 flex-1">
              {listing.title}
            </h3>
            <ConditionBadge condition={listing.condition} className="flex-shrink-0" />
          </div>

          <p className="text-xs text-navy-500 mb-3">{listing.model}</p>

          {/* Price */}
          <div className="mt-auto">
            <p className="text-xl font-bold text-navy-800 mb-2">
              {formatPrice(listing.price)}
            </p>

            {/* Meta info */}
            <div className="flex flex-col gap-1">
              <div className="flex items-center gap-1 text-xs text-navy-400">
                <MapPin className="h-3 w-3 flex-shrink-0" />
                <span className="truncate">{listing.location}</span>
              </div>
              {listing.shippingAvailable && (
                <div className="flex items-center gap-1 text-xs text-emerald-600">
                  <Truck className="h-3 w-3 flex-shrink-0" />
                  <span>Ships nationwide</span>
                </div>
              )}
            </div>

            {/* Seller + Time */}
            <div className="flex items-center justify-between mt-3 pt-3 border-t border-cream-200">
              <div className="flex items-center gap-1.5">
                {listing.user.image ? (
                  <Image
                    src={listing.user.image}
                    alt={displayName}
                    width={20}
                    height={20}
                    className="rounded-full"
                  />
                ) : (
                  <div className="w-5 h-5 rounded-full bg-navy-200 text-navy-700 flex items-center justify-center text-xs font-bold">
                    {getInitials(displayName).charAt(0)}
                  </div>
                )}
                <span className="text-xs text-navy-500 truncate max-w-[80px]">{displayName}</span>
              </div>
              <div className="flex items-center gap-1 text-xs text-navy-400">
                <Clock className="h-3 w-3" />
                <span>{formatRelativeTime(listing.createdAt)}</span>
              </div>
            </div>
          </div>
        </div>
      </div>
    </Link>
  );
}
