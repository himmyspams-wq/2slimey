import { NextRequest, NextResponse } from 'next/server';
import { getServerSession } from 'next-auth';
import { authOptions } from '@/lib/auth';
import { prisma } from '@/lib/prisma';
import { createListingSchema } from '@/lib/validations';
import { ALLOWED_BRANDS } from '@/lib/brands';
import { checkRateLimit } from '@/lib/rate-limit';

const PER_PAGE = 12;

export async function GET(req: NextRequest) {
  try {
    const { searchParams } = req.nextUrl;
    const brands = searchParams.getAll('brand').filter((b) =>
      (ALLOWED_BRANDS as readonly string[]).includes(b)
    );
    const minPrice = searchParams.get('minPrice');
    const maxPrice = searchParams.get('maxPrice');
    const conditions = searchParams.getAll('condition');
    const sort = searchParams.get('sort') || 'newest';
    const q = searchParams.get('q');
    const page = Math.max(1, parseInt(searchParams.get('page') || '1'));
    const skip = (page - 1) * PER_PAGE;

    const conditionFilter = conditions.map((c) => {
      const [min, max] = c.split('-').map(Number);
      return { condition: { gte: min, lte: max } };
    });

    const where = {
      status: 'ACTIVE' as const,
      ...(brands.length > 0 && { brand: { in: brands } }),
      ...(minPrice || maxPrice
        ? {
            price: {
              ...(minPrice ? { gte: parseFloat(minPrice) } : {}),
              ...(maxPrice ? { lte: parseFloat(maxPrice) } : {}),
            },
          }
        : {}),
      ...(conditionFilter.length > 0 && { OR: conditionFilter }),
      ...(q
        ? {
            OR: [
              { title: { contains: q, mode: 'insensitive' as const } },
              { brand: { contains: q, mode: 'insensitive' as const } },
              { model: { contains: q, mode: 'insensitive' as const } },
              { description: { contains: q, mode: 'insensitive' as const } },
            ],
          }
        : {}),
    };

    const sortMap: Record<string, object> = {
      newest: { createdAt: 'desc' },
      price_asc: { price: 'asc' },
      price_desc: { price: 'desc' },
    };

    const orderBy = sortMap[sort] || { createdAt: 'desc' };

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
            select: { id: true, name: true, image: true, isVerified: true },
          },
        },
      }),
      prisma.listing.count({ where }),
    ]);

    return NextResponse.json({
      listings,
      total,
      page,
      totalPages: Math.ceil(total / PER_PAGE),
    });
  } catch (error) {
    console.error('GET /api/listings error:', error);
    return NextResponse.json({ error: 'Failed to fetch listings' }, { status: 500 });
  }
}

export async function POST(req: NextRequest) {
  try {
    const session = await getServerSession(authOptions);
    if (!session?.user?.id) {
      return NextResponse.json({ error: 'Authentication required' }, { status: 401 });
    }

    // Rate limit
    const rateCheck = checkRateLimit(session.user.id, 'listing');
    if (!rateCheck.allowed) {
      return NextResponse.json(
        { error: 'You have reached the listing limit. Please try again later.' },
        { status: 429 }
      );
    }

    const body = await req.json();
    const parsed = createListingSchema.safeParse(body);

    if (!parsed.success) {
      const brandError = parsed.error.errors.find((e) => e.path.includes('brand'));
      if (brandError) {
        return NextResponse.json(
          { error: 'Only premium top-tier fishing reel brands are allowed on this marketplace.' },
          { status: 400 }
        );
      }
      return NextResponse.json(
        { error: parsed.error.errors[0]?.message || 'Invalid input' },
        { status: 400 }
      );
    }

    const { imageKeys, ...listingData } = parsed.data as typeof parsed.data & { imageKeys?: string[] };

    // Server-side brand enforcement (double check)
    if (!(ALLOWED_BRANDS as readonly string[]).includes(listingData.brand)) {
      return NextResponse.json(
        { error: 'Only premium top-tier fishing reel brands are allowed on this marketplace.' },
        { status: 400 }
      );
    }

    // Fetch image URLs from the upload keys
    const imageRecords: Array<{ url: string; key: string; order: number }> = [];
    if (imageKeys && imageKeys.length > 0) {
      imageKeys.slice(0, 8).forEach((key, index) => {
        const url = key.startsWith('http') ? key : `/uploads/${key}`;
        imageRecords.push({ url, key, order: index });
      });
    }

    const listing = await prisma.listing.create({
      data: {
        ...listingData,
        userId: session.user.id,
        images: {
          create: imageRecords,
        },
      },
      include: {
        images: true,
        user: { select: { id: true, name: true, image: true } },
      },
    });

    return NextResponse.json(listing, { status: 201 });
  } catch (error) {
    console.error('POST /api/listings error:', error);
    return NextResponse.json({ error: 'Failed to create listing' }, { status: 500 });
  }
}
