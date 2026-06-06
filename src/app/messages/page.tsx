import { redirect } from 'next/navigation';
import Link from 'next/link';
import Image from 'next/image';
import { getServerSession } from 'next-auth';
import { MessageSquare, Clock } from 'lucide-react';
import { authOptions } from '@/lib/auth';
import { prisma } from '@/lib/prisma';
import { formatRelativeTime, getInitials } from '@/lib/utils';

export const dynamic = 'force-dynamic';

async function getConversations(userId: string) {
  try {
    const participants = await prisma.conversationParticipant.findMany({
      where: { userId },
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
              where: { userId: { not: userId } },
              include: {
                user: {
                  select: { id: true, name: true, image: true },
                },
              },
            },
            _count: {
              select: { messages: true },
            },
          },
        },
      },
      orderBy: {
        conversation: {
          updatedAt: 'desc',
        },
      },
    });

    return participants;
  } catch {
    return [];
  }
}

export default async function MessagesPage() {
  const session = await getServerSession(authOptions);
  if (!session) redirect('/auth/signin?callbackUrl=/messages');

  const participants = await getConversations(session.user.id);

  return (
    <div className="container-main py-8 max-w-3xl">
      <div className="flex items-center gap-3 mb-6">
        <MessageSquare className="h-6 w-6 text-navy-700" />
        <h1 className="font-serif text-3xl font-bold text-navy-800">Messages</h1>
      </div>

      {participants.length === 0 ? (
        <div className="card p-12 text-center">
          <MessageSquare className="h-12 w-12 text-navy-300 mx-auto mb-4" />
          <h3 className="font-serif text-xl font-bold text-navy-700 mb-2">No conversations yet</h3>
          <p className="text-navy-500 text-sm mb-6">
            Find a reel you like and message the seller to get started.
          </p>
          <Link href="/listings" className="btn-primary">
            Browse Listings
          </Link>
        </div>
      ) : (
        <div className="space-y-3">
          {participants.map((participant) => {
            const convo = participant.conversation;
            const otherUser = convo.participants[0]?.user;
            const lastMessage = convo.messages[0];
            const listingImage = convo.listing?.images?.[0];

            return (
              <Link
                key={convo.id}
                href={`/messages/${convo.id}`}
                className="card p-4 flex gap-4 hover:shadow-md transition-all hover:border-navy-200"
              >
                {/* Listing thumbnail */}
                <div className="flex-shrink-0 w-16 h-16 rounded-lg overflow-hidden bg-cream-100">
                  {listingImage ? (
                    <Image
                      src={listingImage.url}
                      alt={convo.listing?.title || 'Listing'}
                      width={64}
                      height={64}
                      className="object-cover w-full h-full"
                    />
                  ) : (
                    <div className="w-full h-full flex items-center justify-center text-2xl">
                      🎣
                    </div>
                  )}
                </div>

                {/* Content */}
                <div className="flex-1 min-w-0">
                  <div className="flex items-start justify-between gap-2">
                    <div className="min-w-0">
                      <div className="flex items-center gap-2 mb-0.5">
                        {otherUser?.image ? (
                          <Image
                            src={otherUser.image}
                            alt={otherUser.name || 'User'}
                            width={20}
                            height={20}
                            className="rounded-full"
                          />
                        ) : (
                          <div className="w-5 h-5 rounded-full bg-navy-200 text-navy-700 flex items-center justify-center text-xs font-bold">
                            {getInitials(otherUser?.name || 'U').charAt(0)}
                          </div>
                        )}
                        <span className="font-semibold text-navy-800 text-sm truncate">
                          {otherUser?.name || 'User'}
                        </span>
                      </div>
                      <p className="text-xs text-navy-500 truncate">
                        Re: {convo.listing?.title || 'Deleted listing'}
                      </p>
                    </div>
                    {lastMessage && (
                      <div className="flex items-center gap-1 text-xs text-navy-400 flex-shrink-0">
                        <Clock className="h-3 w-3" />
                        <span>{formatRelativeTime(lastMessage.createdAt)}</span>
                      </div>
                    )}
                  </div>

                  {lastMessage && (
                    <p className="text-sm text-navy-600 mt-1.5 truncate">
                      {lastMessage.senderId === session.user.id && (
                        <span className="text-navy-400">You: </span>
                      )}
                      {lastMessage.content}
                    </p>
                  )}
                </div>
              </Link>
            );
          })}
        </div>
      )}
    </div>
  );
}
