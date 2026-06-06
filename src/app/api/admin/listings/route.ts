import { NextRequest, NextResponse } from 'next/server';
import { getServerSession } from 'next-auth';
import { authOptions } from '@/lib/auth';
import { prisma } from '@/lib/prisma';

const PER_PAGE = 20;

export async function GET(req: NextRequest) {
  try {
    const session = await getServerSession(authOptions);
    if (!session?.user?.isAdmin) {
      return NextResponse.json({ error: 'Admin access required' }, { status: 403 });
    }

    const { searchParams } = req.nextUrl;
    const status = searchParams.get('status');
    const page = Math.max(1, parseInt(searchParams.get('page') || '1'));
    const skip = (page - 1) * PER_PAGE;

    const where = status && status !== 'ALL'
      ? { status: status as 'ACTIVE' | 'SOLD' | 'REMOVED' | 'DRAFT' }
      : {};

    const [listings, total, activeListings, pendingReports, totalUsers] = await Promise.all([
      prisma.listing.findMany({
        where,
        orderBy: { createdAt: 'desc' },
        skip,
        take: PER_PAGE,
        include: {
          user: {
            select: { name: true, email: true },
          },
        },
      }),
      prisma.listing.count({ where }),
      prisma.listing.count({ where: { status: 'ACTIVE' } }),
      prisma.report.count({ where: { status: 'PENDING' } }),
      prisma.user.count(),
    ]);

    return NextResponse.json({
      listings,
      total,
      page,
      totalPages: Math.ceil(total / PER_PAGE),
      stats: {
        totalListings: total,
        activeListings,
        pendingReports,
        totalUsers,
      },
    });
  } catch (error) {
    console.error('GET /api/admin/listings error:', error);
    return NextResponse.json({ error: 'Failed to fetch listings' }, { status: 500 });
  }
}

export async function PATCH(req: NextRequest) {
  try {
    const session = await getServerSession(authOptions);
    if (!session?.user?.isAdmin) {
      return NextResponse.json({ error: 'Admin access required' }, { status: 403 });
    }

    const body = await req.json();
    const { id, status } = body;

    if (!id || !status) {
      return NextResponse.json({ error: 'Missing required fields' }, { status: 400 });
    }

    const validStatuses = ['ACTIVE', 'SOLD', 'REMOVED', 'DRAFT'];
    if (!validStatuses.includes(status)) {
      return NextResponse.json({ error: 'Invalid status' }, { status: 400 });
    }

    const updated = await prisma.listing.update({
      where: { id },
      data: { status: status as 'ACTIVE' | 'SOLD' | 'REMOVED' | 'DRAFT' },
    });

    return NextResponse.json(updated);
  } catch (error) {
    console.error('PATCH /api/admin/listings error:', error);
    return NextResponse.json({ error: 'Failed to update listing' }, { status: 500 });
  }
}
