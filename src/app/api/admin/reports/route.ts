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
    const status = searchParams.get('status') || 'PENDING';
    const page = Math.max(1, parseInt(searchParams.get('page') || '1'));
    const skip = (page - 1) * PER_PAGE;

    const where =
      status === 'ALL'
        ? {}
        : { status: status as 'PENDING' | 'RESOLVED' | 'DISMISSED' };

    const [reports, total] = await Promise.all([
      prisma.report.findMany({
        where,
        orderBy: { createdAt: 'desc' },
        skip,
        take: PER_PAGE,
        include: {
          listing: {
            select: { id: true, title: true, brand: true },
          },
          user: {
            select: { name: true, email: true },
          },
        },
      }),
      prisma.report.count({ where }),
    ]);

    return NextResponse.json({
      reports,
      total,
      page,
      totalPages: Math.ceil(total / PER_PAGE),
    });
  } catch (error) {
    console.error('GET /api/admin/reports error:', error);
    return NextResponse.json({ error: 'Failed to fetch reports' }, { status: 500 });
  }
}

export async function PATCH(req: NextRequest) {
  try {
    const session = await getServerSession(authOptions);
    if (!session?.user?.isAdmin) {
      return NextResponse.json({ error: 'Admin access required' }, { status: 403 });
    }

    const body = await req.json();
    const { id, status, removeListing } = body;

    if (!id || !status) {
      return NextResponse.json({ error: 'Missing required fields' }, { status: 400 });
    }

    const validStatuses = ['RESOLVED', 'DISMISSED'];
    if (!validStatuses.includes(status)) {
      return NextResponse.json({ error: 'Invalid status' }, { status: 400 });
    }

    const report = await prisma.report.update({
      where: { id },
      data: {
        status: status as 'RESOLVED' | 'DISMISSED',
        resolvedAt: new Date(),
      },
      include: {
        listing: { select: { id: true } },
      },
    });

    // Optionally remove the listing
    if (removeListing && report.listingId) {
      await prisma.listing.update({
        where: { id: report.listingId },
        data: { status: 'REMOVED' },
      });
    }

    return NextResponse.json(report);
  } catch (error) {
    console.error('PATCH /api/admin/reports error:', error);
    return NextResponse.json({ error: 'Failed to update report' }, { status: 500 });
  }
}
