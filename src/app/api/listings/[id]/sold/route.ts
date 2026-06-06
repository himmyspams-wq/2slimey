import { NextRequest, NextResponse } from 'next/server';
import { getServerSession } from 'next-auth';
import { authOptions } from '@/lib/auth';
import { prisma } from '@/lib/prisma';

interface RouteParams {
  params: { id: string };
}

export async function POST(_req: NextRequest, { params }: RouteParams) {
  try {
    const session = await getServerSession(authOptions);
    if (!session?.user?.id) {
      return NextResponse.json({ error: 'Authentication required' }, { status: 401 });
    }

    const listing = await prisma.listing.findUnique({
      where: { id: params.id },
      select: { userId: true, status: true },
    });

    if (!listing) {
      return NextResponse.json({ error: 'Listing not found' }, { status: 404 });
    }

    if (listing.userId !== session.user.id) {
      return NextResponse.json({ error: 'Not authorized' }, { status: 403 });
    }

    if (listing.status === 'SOLD') {
      return NextResponse.json({ error: 'Listing is already marked as sold' }, { status: 400 });
    }

    const updated = await prisma.listing.update({
      where: { id: params.id },
      data: {
        status: 'SOLD',
        soldAt: new Date(),
      },
    });

    return NextResponse.json(updated);
  } catch (error) {
    console.error('POST /api/listings/[id]/sold error:', error);
    return NextResponse.json({ error: 'Failed to update listing status' }, { status: 500 });
  }
}
