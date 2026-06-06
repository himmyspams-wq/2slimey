import { NextRequest, NextResponse } from 'next/server';
import { getServerSession } from 'next-auth';
import { authOptions } from '@/lib/auth';
import { prisma } from '@/lib/prisma';
import { checkRateLimit } from '@/lib/rate-limit';

interface RouteParams {
  params: { conversationId: string };
}

async function verifyParticipant(conversationId: string, userId: string) {
  const participant = await prisma.conversationParticipant.findUnique({
    where: {
      conversationId_userId: {
        conversationId,
        userId,
      },
    },
  });
  return !!participant;
}

export async function GET(_req: NextRequest, { params }: RouteParams) {
  try {
    const session = await getServerSession(authOptions);
    if (!session?.user?.id) {
      return NextResponse.json({ error: 'Authentication required' }, { status: 401 });
    }

    const isParticipant = await verifyParticipant(params.conversationId, session.user.id);
    if (!isParticipant) {
      return NextResponse.json({ error: 'Not authorized' }, { status: 403 });
    }

    const [messages, conversation] = await Promise.all([
      prisma.message.findMany({
        where: { conversationId: params.conversationId },
        orderBy: { createdAt: 'asc' },
        include: {
          sender: {
            select: { id: true, name: true, image: true },
          },
        },
      }),
      prisma.conversation.findUnique({
        where: { id: params.conversationId },
        include: {
          listing: {
            select: {
              id: true,
              title: true,
              price: true,
              status: true,
              images: {
                orderBy: { order: 'asc' },
                take: 1,
              },
            },
          },
          participants: {
            include: {
              user: {
                select: { id: true, name: true, image: true },
              },
            },
          },
        },
      }),
    ]);

    // Mark unread messages as read
    await prisma.message.updateMany({
      where: {
        conversationId: params.conversationId,
        senderId: { not: session.user.id },
        readAt: null,
      },
      data: { readAt: new Date() },
    });

    // Update lastReadAt for participant
    await prisma.conversationParticipant.update({
      where: {
        conversationId_userId: {
          conversationId: params.conversationId,
          userId: session.user.id,
        },
      },
      data: { lastReadAt: new Date() },
    });

    return NextResponse.json({ messages, conversation });
  } catch (error) {
    console.error('GET /api/messages/[conversationId] error:', error);
    return NextResponse.json({ error: 'Failed to fetch messages' }, { status: 500 });
  }
}

export async function POST(req: NextRequest, { params }: RouteParams) {
  try {
    const session = await getServerSession(authOptions);
    if (!session?.user?.id) {
      return NextResponse.json({ error: 'Authentication required' }, { status: 401 });
    }

    // Rate limit
    const rateCheck = checkRateLimit(session.user.id, 'message');
    if (!rateCheck.allowed) {
      return NextResponse.json({ error: 'Too many messages. Please slow down.' }, { status: 429 });
    }

    const isParticipant = await verifyParticipant(params.conversationId, session.user.id);
    if (!isParticipant) {
      return NextResponse.json({ error: 'Not authorized' }, { status: 403 });
    }

    const body = await req.json();
    const content = body.content?.trim();

    if (!content || content.length === 0) {
      return NextResponse.json({ error: 'Message cannot be empty' }, { status: 400 });
    }

    if (content.length > 2000) {
      return NextResponse.json({ error: 'Message too long (max 2000 characters)' }, { status: 400 });
    }

    const message = await prisma.message.create({
      data: {
        conversationId: params.conversationId,
        senderId: session.user.id,
        content,
      },
      include: {
        sender: {
          select: { id: true, name: true, image: true },
        },
      },
    });

    // Update conversation updatedAt
    await prisma.conversation.update({
      where: { id: params.conversationId },
      data: { updatedAt: new Date() },
    });

    return NextResponse.json(message, { status: 201 });
  } catch (error) {
    console.error('POST /api/messages/[conversationId] error:', error);
    return NextResponse.json({ error: 'Failed to send message' }, { status: 500 });
  }
}
