import { notFound } from 'next/navigation';
import Link from 'next/link';
import Image from 'next/image';
import { getServerSession } from 'next-auth';
import { BadgeCheck, MapPin, Calendar, MessageSquare } from 'lucide-react';
import { authOptions } from '@/lib/auth';
import { prisma } from '@/lib/prisma';
import { formatRelativeTime, getInitials } from '@/lib/utils';
import ListingCard from '@/components/ListingCard';

interface PublicProfilePageProps {
  params: { id: string };
}

async function getUserWithListings(id: string) {
  try {
    return await prisma.user.findUnique({
      where: { id },
      select: {
        id: true,
        name: true,
        image: true,
        username: true,
        location: true,
        bio: true,
        isVerified: true,
        createdAt: true,
        listings: {
          where: { status: 'ACTIVE' },
          orderBy: { createdAt: 'desc' },
          include: {
            images: {
              orderBy: { order: 'asc' },
              take: 1,
            },
            user: {
              select: { id: true, name: true, image: true },
            },
          },
        },
      },
    });
  } catch {
    return null;
  }
}

export default async function PublicProfilePage({ params }: PublicProfilePageProps) {
  const [user, session] = await Promise.all([
    getUserWithListings(params.id),
    getServerSession(authOptions),
  ]);

  if (!user) notFound();

  const isOwnProfile = session?.user?.id === user.id;
  const displayName = user.name || user.username || 'Anonymous';

  return (
    <div className="container-main py-8 max-w-5xl">
      {/* Profile Header */}
      <div className="card p-8 mb-8">
        <div className="flex flex-col sm:flex-row items-center sm:items-start gap-6">
          {user.image ? (
            <Image
              src={user.image}
              alt={displayName}
              width={96}
              height={96}
              className="rounded-full flex-shrink-0"
            />
          ) : (
            <div className="w-24 h-24 rounded-full bg-navy-700 text-white flex items-center justify-center text-3xl font-bold flex-shrink-0">
              {getInitials(displayName)}
            </div>
          )}

          <div className="flex-1 text-center sm:text-left">
            <div className="flex items-center justify-center sm:justify-start gap-2 mb-1">
              <h1 className="font-serif text-2xl font-bold text-navy-800">{displayName}</h1>
              {user.isVerified && (
                <BadgeCheck className="h-6 w-6 text-blue-500" aria-label="Verified seller" />
              )}
            </div>

            {user.username && (
              <p className="text-navy-500 text-sm mb-2">@{user.username}</p>
            )}

            <div className="flex flex-wrap items-center justify-center sm:justify-start gap-4 text-sm text-navy-500">
              {user.location && (
                <div className="flex items-center gap-1">
                  <MapPin className="h-4 w-4" />
                  <span>{user.location}</span>
                </div>
              )}
              <div className="flex items-center gap-1">
                <Calendar className="h-4 w-4" />
                <span>Member {formatRelativeTime(user.createdAt)}</span>
              </div>
              <span>{user.listings.length} active listing{user.listings.length !== 1 ? 's' : ''}</span>
            </div>

            {user.bio && (
              <p className="text-navy-600 text-sm leading-relaxed mt-3 max-w-lg">{user.bio}</p>
            )}
          </div>

          {!isOwnProfile && session && user.listings.length > 0 && (
            <Link
              href={`/messages/new?listing=${user.listings[0].id}&seller=${user.id}`}
              className="btn-secondary flex-shrink-0"
            >
              <MessageSquare className="h-4 w-4" />
              Message Seller
            </Link>
          )}

          {isOwnProfile && (
            <Link href="/profile" className="btn-secondary flex-shrink-0">
              Edit Profile
            </Link>
          )}
        </div>
      </div>

      {/* Active Listings */}
      <h2 className="font-serif text-2xl font-bold text-navy-800 mb-5">
        {isOwnProfile ? 'My Listings' : `${displayName}'s Listings`}
      </h2>

      {user.listings.length === 0 ? (
        <div className="card p-10 text-center">
          <p className="text-navy-500 text-sm">No active listings at the moment.</p>
        </div>
      ) : (
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-5">
          {user.listings.map((listing) => (
            <ListingCard
              key={listing.id}
              listing={{
                ...listing,
                price: listing.price.toString(),
              }}
            />
          ))}
        </div>
      )}
    </div>
  );
}
