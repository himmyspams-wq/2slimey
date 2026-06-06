import { NextRequest, NextResponse } from 'next/server';
import { getServerSession } from 'next-auth';
import { authOptions } from '@/lib/auth';
import { prisma } from '@/lib/prisma';
import { updateListingSchema } from '@/lib/validations';
import { ALLOWED_BRANDS } from '@/lib/brands';

interface RouteParams {
  params: { id: string };
}

export async function GET(_req: NextRequest, { params }: RouteParams) {
  try {
    const listing = await prisma.listing.findUnique({
      where: { id: params.id },
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
        _count: { select: { conversations: true } },
      },
    });

    if (!listing) {
      return NextResponse.json({ error: 'Listing not found' }, { status: 404 });
    }

    // Increment view count
    prisma.listing.update({
      where: { id: params.id },
      data: { viewCount: { increment: 1 } },
    }).catch(() => {});

    return NextResponse.json(listing);
  } catch (error) {
    console.error('GET /api/listings/[id] error:', error);
    return NextResponse.json({ error: 'Failed to fetch listing' }, { status: 500 });
  }
}

export async function PUT(req: NextRequest, { params }: RouteParams) {
  try {
    const session = await getServerSession(authOptions);
    if (!session?.user?.id) {
      return NextResponse.json({ error: 'Authentication required' }, { status: 401 });
    }

    const listing = await prisma.listing.findUnique({
      where: { id: params.id },
      select: { userId: true },
    });

    if (!listing) {
      return NextResponse.json({ error: 'Listing not found' }, { status: 404 });
    }

    const isOwner = listing.userId === session.user.id;
    const isAdmin = session.user.isAdmin;

    if (!isOwner && !isAdmin) {
      return NextResponse.json({ error: 'Not authorized' }, { status: 403 });
    }

    const body = await req.json();
    const parsed = updateListingSchema.safeParse(body);

    if (!parsed.success) {
      return NextResponse.json(
        { error: parsed.error.errors[0]?.message || 'Invalid input' },
        { status: 400 }
      );
    }

    // Brand whitelist enforcement
    if (parsed.data.brand && !(ALLOWED_BRANDS as readonly string[]).includes(parsed.data.brand)) {
      return NextResponse.json(
        { error: 'Only premium top-tier fishing reel brands are allowed on this marketplace.' },
        { status: 400 }
      );
    }

    const updated = await prisma.listing.update({
      where: { id: params.id },
      data: parsed.data,
      include: {
        images: { orderBy: { order: 'asc' } },
        user: { select: { id: true, name: true, image: true } },
      },
    });

    return NextResponse.json(updated);
  } catch (error) {
    console.error('PUT /api/listings/[id] error:', error);
    return NextResponse.json({ error: 'Failed to update listing' }, { status: 500 });
  }
}

export async function DELETE(_req: NextRequest, { params }: RouteParams) {
  try {
    const session = await getServerSession(authOptions);
    if (!session?.user?.id) {
      return NextResponse.json({ error: 'Authentication required' }, { status: 401 });
    }

    const listing = await prisma.listing.findUnique({
      where: { id: params.id },
      select: { userId: true },
    });

    if (!listing) {
      return NextResponse.json({ error: 'Listing not found' }, { status: 404 });
    }

    const isOwner = listing.userId === session.user.id;
    const isAdmin = session.user.isAdmin;

    if (!isOwner && !isAdmin) {
      return NextResponse.json({ error: 'Not authorized' }, { status: 403 });
    }

    await prisma.listing.delete({ where: { id: params.id } });

    return new NextResponse(null, { status: 204 });
  } catch (error) {
    console.error('DELETE /api/listings/[id] error:', error);
    return NextResponse.json({ error: 'Failed to delete listing' }, { status: 500 });
  }
}
