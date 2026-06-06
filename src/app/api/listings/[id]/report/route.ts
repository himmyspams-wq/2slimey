import { NextRequest, NextResponse } from 'next/server';
import { getServerSession } from 'next-auth';
import { authOptions } from '@/lib/auth';
import { prisma } from '@/lib/prisma';
import { reportListingSchema } from '@/lib/validations';
import { checkRateLimit } from '@/lib/rate-limit';

interface RouteParams {
  params: { id: string };
}

export async function POST(req: NextRequest, { params }: RouteParams) {
  try {
    const session = await getServerSession(authOptions);
    if (!session?.user?.id) {
      return NextResponse.json({ error: 'Authentication required' }, { status: 401 });
    }

    // Rate limit
    const rateCheck = checkRateLimit(session.user.id, 'report');
    if (!rateCheck.allowed) {
      return NextResponse.json(
        { error: 'Too many reports submitted. Please try again later.' },
        { status: 429 }
      );
    }

    const listing = await prisma.listing.findUnique({
      where: { id: params.id },
      select: { userId: true },
    });

    if (!listing) {
      return NextResponse.json({ error: 'Listing not found' }, { status: 404 });
    }

    // Can't report own listing
    if (listing.userId === session.user.id) {
      return NextResponse.json({ error: 'You cannot report your own listing.' }, { status: 400 });
    }

    // Check for duplicate report
    const existing = await prisma.report.findFirst({
      where: {
        listingId: params.id,
        userId: session.user.id,
      },
    });

    if (existing) {
      return NextResponse.json(
        { error: 'You have already reported this listing.' },
        { status: 409 }
      );
    }

    const body = await req.json();
    const parsed = reportListingSchema.safeParse(body);

    if (!parsed.success) {
      return NextResponse.json(
        { error: parsed.error.errors[0]?.message || 'Invalid input' },
        { status: 400 }
      );
    }

    const report = await prisma.report.create({
      data: {
        listingId: params.id,
        userId: session.user.id,
        reason: parsed.data.reason as 'SPAM' | 'COUNTERFEIT' | 'WRONG_BRAND' | 'MISLEADING' | 'OTHER',
        details: parsed.data.details,
      },
    });

    return NextResponse.json(report, { status: 201 });
  } catch (error) {
    console.error('POST /api/listings/[id]/report error:', error);
    return NextResponse.json({ error: 'Failed to submit report' }, { status: 500 });
  }
}
