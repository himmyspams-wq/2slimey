import Image from 'next/image';
import Link from 'next/link';
import { BadgeCheck, MapPin, Calendar } from 'lucide-react';
import { formatRelativeTime, getInitials } from '@/lib/utils';

interface SellerCardProps {
  user: {
    id: string;
    name?: string | null;
    image?: string | null;
    isVerified: boolean;
    createdAt: Date | string;
    location?: string | null;
  };
}

export default function SellerCard({ user }: SellerCardProps) {
  const displayName = user.name || 'Anonymous Seller';

  return (
    <div className="card p-4">
      <h3 className="text-sm font-semibold text-navy-500 uppercase tracking-wider mb-3">
        Seller
      </h3>
      <div className="flex items-start gap-3">
        {user.image ? (
          <Image
            src={user.image}
            alt={displayName}
            width={48}
            height={48}
            className="rounded-full flex-shrink-0"
          />
        ) : (
          <div className="w-12 h-12 rounded-full bg-navy-700 text-white flex items-center justify-center text-sm font-bold flex-shrink-0">
            {getInitials(displayName)}
          </div>
        )}
        <div className="flex-1 min-w-0">
          <div className="flex items-center gap-1.5">
            <span className="font-semibold text-navy-800 text-sm truncate">{displayName}</span>
            {user.isVerified && (
              <BadgeCheck className="h-4 w-4 text-blue-500 flex-shrink-0" aria-label="Verified seller" />
            )}
          </div>
          {user.location && (
            <div className="flex items-center gap-1 text-xs text-navy-400 mt-0.5">
              <MapPin className="h-3 w-3" />
              <span>{user.location}</span>
            </div>
          )}
          <div className="flex items-center gap-1 text-xs text-navy-400 mt-0.5">
            <Calendar className="h-3 w-3" />
            <span>Member {formatRelativeTime(user.createdAt)}</span>
          </div>
        </div>
      </div>

      <Link
        href={`/profile/${user.id}`}
        className="mt-3 block text-center text-sm text-navy-600 hover:text-navy-800 border border-navy-200 hover:border-navy-400 rounded-lg py-2 transition-all"
      >
        View Profile
      </Link>
    </div>
  );
}
