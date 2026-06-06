import { Suspense } from 'react';
import Link from 'next/link';
import { prisma } from '@/lib/prisma';
import { ALLOWED_BRANDS } from '@/lib/brands';
import ListingCard from '@/components/ListingCard';
import SearchFilters from '@/components/SearchFilters';
import { SlidersHorizontal, Plus } from 'lucide-react';

const PER_PAGE = 12;

interface SearchParams {
  brand?: string | string[];
  minPrice?: string;
  maxPrice?: string;
  condition?: string | string[];
  sort?: string;
  q?: string;
  page?: string;
}

async function getListings(searchParams: SearchParams) {
  const page = Math.max(1, parseInt(searchParams.page || '1'));
  const skip = (page - 1) * PER_PAGE;

  const brands = Array.isArray(searchParams.brand)
    ? searchParams.brand
    : searchParams.brand
    ? [searchParams.brand]
    : [];

  const conditions = Array.isArray(searchParams.condition)
    ? searchParams.condition
    : searchParams.condition
    ? [searchParams.condition]
    : [];

  // Build condition filter from range groups like "7-8"
  const conditionFilter: { condition: { gte: number; lte: number } }[] = conditions.map((c) => {
    const [min, max] = c.split('-').map(Number);
    return { condition: { gte: min, lte: max } };
  });

  const brandFilter = brands.length > 0
    ? brands.filter((b) => (ALLOWED_BRANDS as readonly string[]).includes(b))
    : [];

  const where = {
    status: 'ACTIVE' as const,
    ...(brandFilter.length > 0 && { brand: { in: brandFilter } }),
    ...(searchParams.minPrice || searchParams.maxPrice
      ? {
          price: {
            ...(searchParams.minPrice ? { gte: parseFloat(searchParams.minPrice) } : {}),
            ...(searchParams.maxPrice ? { lte: parseFloat(searchParams.maxPrice) } : {}),
          },
        }
      : {}),
    ...(conditionFilter.length > 0 && { OR: conditionFilter }),
    ...(searchParams.q
      ? {
          OR: [
            { title: { contains: searchParams.q, mode: 'insensitive' as const } },
            { brand: { contains: searchParams.q, mode: 'insensitive' as const } },
            { model: { contains: searchParams.q, mode: 'insensitive' as const } },
            { description: { contains: searchParams.q, mode: 'insensitive' as const } },
          ],
        }
      : {}),
  };

  const sortMap: Record<string, object> = {
    newest: { createdAt: 'desc' },
    price_asc: { price: 'asc' },
    price_desc: { price: 'desc' },
  };

  const orderBy = sortMap[searchParams.sort || 'newest'] || { createdAt: 'desc' };

  try {
    const [listings, total] = await Promise.all([
      prisma.listing.findMany({
        where,
        orderBy,
        skip,
        take: PER_PAGE,
        include: {
          images: {
            orderBy: { order: 'asc' },
            take: 1,
          },
          user: {
            select: { id: true, name: true, image: true },
          },
        },
      }),
      prisma.listing.count({ where }),
    ]);

    return { listings, total, page, totalPages: Math.ceil(total / PER_PAGE) };
  } catch {
    return { listings: [], total: 0, page: 1, totalPages: 0 };
  }
}

interface ListingsPageProps {
  searchParams: SearchParams;
}

export default async function ListingsPage({ searchParams }: ListingsPageProps) {
  const { listings, total, page, totalPages } = await getListings(searchParams);

  const brands = Array.isArray(searchParams.brand)
    ? searchParams.brand
    : searchParams.brand
    ? [searchParams.brand]
    : [];
  const conditions = Array.isArray(searchParams.condition)
    ? searchParams.condition
    : searchParams.condition
    ? [searchParams.condition]
    : [];
  const activeFilterCount =
    brands.length +
    conditions.length +
    (searchParams.minPrice ? 1 : 0) +
    (searchParams.maxPrice ? 1 : 0);

  return (
    <div className="container-main py-8">
      {/* Page Header */}
      <div className="flex items-center justify-between mb-6">
        <div>
          <h1 className="font-serif text-3xl font-bold text-navy-800">Browse Reels</h1>
          <p className="text-navy-500 text-sm mt-1">
            {total > 0 ? `${total} listing${total !== 1 ? 's' : ''} available` : 'No listings found'}
            {searchParams.q && ` for "${searchParams.q}"`}
          </p>
        </div>
        <Link href="/listings/new" className="btn-primary">
          <Plus className="h-4 w-4" />
          List a Reel
        </Link>
      </div>

      {/* Search Bar */}
      <form method="GET" action="/listings" className="mb-6">
        <div className="flex gap-2">
          <input
            type="text"
            name="q"
            defaultValue={searchParams.q || ''}
            placeholder="Search by brand, model, title..."
            className="input-base flex-1"
          />
          <button type="submit" className="btn-primary px-6">
            Search
          </button>
        </div>
      </form>

      <div className="flex gap-8">
        {/* Sidebar Filters */}
        <aside className="hidden lg:block w-64 flex-shrink-0">
          <div className="card p-5 sticky top-20">
            <div className="flex items-center gap-2 mb-4">
              <SlidersHorizontal className="h-4 w-4 text-navy-600" />
              <h2 className="font-semibold text-navy-700 text-sm uppercase tracking-wider">Filters</h2>
              {activeFilterCount > 0 && (
                <span className="bg-navy-700 text-white text-xs px-2 py-0.5 rounded-full ml-auto">
                  {activeFilterCount}
                </span>
              )}
            </div>
            <Suspense fallback={<div className="animate-pulse space-y-4">
              {[1,2,3].map(i => <div key={i} className="h-24 bg-cream-100 rounded" />)}
            </div>}>
              <SearchFilters />
            </Suspense>
          </div>
        </aside>

        {/* Listings Grid */}
        <div className="flex-1 min-w-0">
          {listings.length === 0 ? (
            <div className="card p-12 text-center">
              <div className="text-5xl mb-4">🎣</div>
              <h3 className="font-serif text-xl font-bold text-navy-700 mb-2">No listings found</h3>
              <p className="text-navy-500 text-sm mb-6">
                Try adjusting your filters or be the first to list a reel!
              </p>
              <Link href="/listings/new" className="btn-primary">
                <Plus className="h-4 w-4" />
                List Your Reel
              </Link>
            </div>
          ) : (
            <>
              <div className="grid grid-cols-1 sm:grid-cols-2 xl:grid-cols-3 gap-5">
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

              {/* Pagination */}
              {totalPages > 1 && (
                <div className="flex items-center justify-center gap-2 mt-10">
                  {page > 1 && (
                    <Link
                      href={`/listings?${new URLSearchParams({ ...searchParams as Record<string, string>, page: String(page - 1) }).toString()}`}
                      className="btn-secondary py-2 px-4 text-sm"
                    >
                      Previous
                    </Link>
                  )}
                  <div className="flex items-center gap-1">
                    {Array.from({ length: Math.min(5, totalPages) }, (_, i) => {
                      const p = i + Math.max(1, page - 2);
                      if (p > totalPages) return null;
                      return (
                        <Link
                          key={p}
                          href={`/listings?${new URLSearchParams({ ...searchParams as Record<string, string>, page: String(p) }).toString()}`}
                          className={`w-9 h-9 flex items-center justify-center rounded-lg text-sm font-medium transition-all ${
                            p === page
                              ? 'bg-navy-700 text-white'
                              : 'text-navy-600 hover:bg-navy-100'
                          }`}
                        >
                          {p}
                        </Link>
                      );
                    })}
                  </div>
                  {page < totalPages && (
                    <Link
                      href={`/listings?${new URLSearchParams({ ...searchParams as Record<string, string>, page: String(page + 1) }).toString()}`}
                      className="btn-secondary py-2 px-4 text-sm"
                    >
                      Next
                    </Link>
                  )}
                </div>
              )}
            </>
          )}
        </div>
      </div>
    </div>
  );
}
