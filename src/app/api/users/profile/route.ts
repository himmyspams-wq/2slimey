import { NextRequest, NextResponse } from 'next/server';
import { getServerSession } from 'next-auth';
import { authOptions } from '@/lib/auth';
import { prisma } from '@/lib/prisma';
import { updateProfileSchema } from '@/lib/validations';

export async function GET(_req: NextRequest) {
  try {
    const session = await getServerSession(authOptions);
    if (!session?.user?.id) {
      return NextResponse.json({ error: 'Authentication required' }, { status: 401 });
    }

    const user = await prisma.user.findUnique({
      where: { id: session.user.id },
      select: {
        id: true,
        name: true,
        email: true,
        image: true,
        username: true,
        location: true,
        bio: true,
        isVerified: true,
        isAdmin: true,
        createdAt: true,
        listings: {
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

    if (!user) {
      return NextResponse.json({ error: 'User not found' }, { status: 404 });
    }

    return NextResponse.json(user);
  } catch (error) {
    console.error('GET /api/users/profile error:', error);
    return NextResponse.json({ error: 'Failed to fetch profile' }, { status: 500 });
  }
}

export async function PUT(req: NextRequest) {
  try {
    const session = await getServerSession(authOptions);
    if (!session?.user?.id) {
      return NextResponse.json({ error: 'Authentication required' }, { status: 401 });
    }

    const body = await req.json();
    const parsed = updateProfileSchema.safeParse(body);

    if (!parsed.success) {
      return NextResponse.json(
        { error: parsed.error.errors[0]?.message || 'Invalid input' },
        { status: 400 }
      );
    }

    const { username, ...rest } = parsed.data;

    // Check username uniqueness if provided
    if (username) {
      const existing = await prisma.user.findFirst({
        where: {
          username,
          id: { not: session.user.id },
        },
      });

      if (existing) {
        return NextResponse.json(
          { error: 'This username is already taken.' },
          { status: 409 }
        );
      }
    }

    const updated = await prisma.user.update({
      where: { id: session.user.id },
      data: {
        ...rest,
        ...(username !== undefined && { username }),
      },
      select: {
        id: true,
        name: true,
        email: true,
        image: true,
        username: true,
        location: true,
        bio: true,
        isVerified: true,
        isAdmin: true,
        createdAt: true,
      },
    });

    return NextResponse.json(updated);
  } catch (error) {
    console.error('PUT /api/users/profile error:', error);
    return NextResponse.json({ error: 'Failed to update profile' }, { status: 500 });
  }
}
