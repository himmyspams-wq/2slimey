import { NextRequest, NextResponse } from 'next/server';
import { getServerSession } from 'next-auth';
import { authOptions } from '@/lib/auth';
import { prisma } from '@/lib/prisma';
import { sendMessageSchema } from '@/lib/validations';
import { checkRateLimit } from '@/lib/rate-limit';

export async function GET(_req: NextRequest) {
  try {
    const session = await getServerSession(authOptions);
    if (!session?.user?.id) {
      return NextResponse.json({ error: 'Authentication required' }, { status: 401 });
    }

    const participants = await prisma.conversationParticipant.findMany({
      where: { userId: session.user.id },
      include: {
        conversation: {
          include: {
            listing: {
              select: {
                id: true,
                title: true,
                brand: true,
                price: true,
                status: true,
                images: {
                  orderBy: { order: 'asc' },
                  take: 1,
                },
              },
            },
            messages: {
              orderBy: { createdAt: 'desc' },
              take: 1,
            },
            participants: {
              where: { userId: { not: session.user.id } },
              include: {
                user: {
                  select: { id: true, name: true, image: true },
                },
              },
            },
          },
        },
      },
      orderBy: {
        conversation: { updatedAt: 'desc' },
      },
    });

    return NextResponse.json({ conversations: participants });
  } catch (error) {
    console.error('GET /api/messages error:', error);
    return NextResponse.json({ error: 'Failed to fetch conversations' }, { status: 500 });
  }
}

export async function POST(req: NextRequest) {
  try {
    const session = await getServerSession(authOptions);
    if (!session?.user?.id) {
      return NextResponse.json({ error: 'Authentication required' }, { status: 401 });
    }

    // Rate limit
    const rateCheck = checkRateLimit(session.user.id, 'message');
    if (!rateCheck.allowed) {
      return NextResponse.json(
        { error: 'Too many messages. Please slow down.' },
        { status: 429 }
      );
    }

    const body = await req.json();
    const parsed = sendMessageSchema.safeParse(body);

    if (!parsed.success) {
      return NextResponse.json(
        { error: parsed.error.errors[0]?.message || 'Invalid input' },
        { status: 400 }
      );
    }

    const { content, listingId, recipientId } = parsed.data;

    // Can't message yourself
    if (recipientId === session.user.id) {
      return NextResponse.json({ error: 'You cannot message yourself.' }, { status: 400 });
    }

    // Verify listing exists
    const listing = await prisma.listing.findUnique({
      where: { id: listingId },
      select: { id: true, status: true },
    });

    if (!listing) {
      return NextResponse.json({ error: 'Listing not found' }, { status: 404 });
    }

    // Find or create conversation
    const existingConversation = await prisma.conversation.findFirst({
      where: {
        listingId,
        participants: {
          every: {
            userId: { in: [session.user.id, recipientId] },
          },
        },
      },
      include: {
        participants: true,
      },
    });

    let conversationId: string;

    if (existingConversation && existingConversation.participants.length === 2) {
      conversationId = existingConversation.id;
      // Update updatedAt
      await prisma.conversation.update({
        where: { id: conversationId },
        data: { updatedAt: new Date() },
      });
    } else {
      const conversation = await prisma.conversation.create({
        data: {
          listingId,
          participants: {
            create: [
              { userId: session.user.id },
              { userId: recipientId },
            ],
          },
        },
      });
      conversationId = conversation.id;
    }

    // Create message
    const message = await prisma.message.create({
      data: {
        conversationId,
        senderId: session.user.id,
        content,
      },
      include: {
        sender: {
          select: { id: true, name: true, image: true },
        },
      },
    });

    return NextResponse.json({ conversationId, message }, { status: 201 });
  } catch (error) {
    console.error('POST /api/messages error:', error);
    return NextResponse.json({ error: 'Failed to send message' }, { status: 500 });
  }
}
