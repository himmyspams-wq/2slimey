'use client';

import { useState, useEffect, useRef, useCallback } from 'react';
import { useParams, useRouter } from 'next/navigation';
import { useSession } from 'next-auth/react';
import Link from 'next/link';
import Image from 'next/image';
import { Send, ArrowLeft, Loader2 } from 'lucide-react';
import { formatRelativeTime, formatPrice, getInitials } from '@/lib/utils';
import { cn } from '@/lib/utils';

interface Message {
  id: string;
  content: string;
  senderId: string;
  createdAt: string;
  sender: { id: string; name: string | null; image: string | null };
}

interface Conversation {
  id: string;
  listing: {
    id: string;
    title: string;
    price: string;
    status: string;
    images: Array<{ url: string }>;
  } | null;
  participants: Array<{
    user: { id: string; name: string | null; image: string | null };
  }>;
}

export default function ConversationPage() {
  const params = useParams();
  const router = useRouter();
  const { data: session, status } = useSession();
  const [conversation, setConversation] = useState<Conversation | null>(null);
  const [messages, setMessages] = useState<Message[]>([]);
  const [content, setContent] = useState('');
  const [sending, setSending] = useState(false);
  const [loading, setLoading] = useState(true);
  const messagesEndRef = useRef<HTMLDivElement>(null);
  const pollingRef = useRef<NodeJS.Timeout | null>(null);

  const scrollToBottom = useCallback(() => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  }, []);

  const fetchMessages = useCallback(async () => {
    try {
      const res = await fetch(`/api/messages/${params.conversationId}`);
      if (res.status === 403) {
        router.push('/messages');
        return;
      }
      if (res.ok) {
        const data = await res.json();
        setMessages(data.messages || []);
        if (!conversation) {
          setConversation(data.conversation || null);
        }
      }
    } catch {
      // Silently fail for polling
    } finally {
      setLoading(false);
    }
  }, [params.conversationId, conversation, router]);

  useEffect(() => {
    if (status === 'unauthenticated') {
      router.push('/auth/signin');
      return;
    }
    if (status !== 'authenticated') return;

    fetchMessages();

    // Poll every 5 seconds
    pollingRef.current = setInterval(fetchMessages, 5000);

    return () => {
      if (pollingRef.current) clearInterval(pollingRef.current);
    };
  }, [status, fetchMessages, router]);

  useEffect(() => {
    scrollToBottom();
  }, [messages, scrollToBottom]);

  const handleSend = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!content.trim() || sending) return;

    setSending(true);
    const messageContent = content.trim();
    setContent('');

    try {
      const res = await fetch(`/api/messages/${params.conversationId}`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ content: messageContent }),
      });

      if (res.ok) {
        const data = await res.json();
        setMessages((prev) => [...prev, data]);
        scrollToBottom();
      } else {
        setContent(messageContent); // restore on error
      }
    } catch {
      setContent(messageContent);
    } finally {
      setSending(false);
    }
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center min-h-96">
        <Loader2 className="h-8 w-8 animate-spin text-navy-600" />
      </div>
    );
  }

  const otherParticipant = conversation?.participants.find(
    (p) => p.user.id !== session?.user?.id
  )?.user;

  const listingImage = conversation?.listing?.images?.[0];

  return (
    <div className="container-main py-4 max-w-3xl h-[calc(100vh-5rem)] flex flex-col">
      {/* Header */}
      <div className="card p-4 mb-4 flex items-center gap-3">
        <button
          onClick={() => router.push('/messages')}
          className="p-2 rounded-lg text-navy-600 hover:bg-cream-100 transition-colors"
        >
          <ArrowLeft className="h-5 w-5" />
        </button>

        {otherParticipant && (
          <div className="flex items-center gap-2">
            {otherParticipant.image ? (
              <Image
                src={otherParticipant.image}
                alt={otherParticipant.name || 'User'}
                width={36}
                height={36}
                className="rounded-full"
              />
            ) : (
              <div className="w-9 h-9 rounded-full bg-navy-700 text-white flex items-center justify-center text-sm font-bold">
                {getInitials(otherParticipant.name || 'U')}
              </div>
            )}
            <div>
              <p className="font-semibold text-navy-800 text-sm">
                {otherParticipant.name || 'User'}
              </p>
              {conversation?.listing && (
                <Link
                  href={`/listings/${conversation.listing.id}`}
                  className="text-xs text-navy-500 hover:text-navy-700 truncate block max-w-[200px]"
                >
                  {conversation.listing.title}
                </Link>
              )}
            </div>
          </div>
        )}

        {/* Listing context */}
        {conversation?.listing && listingImage && (
          <Link
            href={`/listings/${conversation.listing.id}`}
            className="ml-auto flex items-center gap-2 px-3 py-1.5 rounded-lg bg-cream-100 hover:bg-cream-200 transition-colors"
          >
            <Image
              src={listingImage.url}
              alt={conversation.listing.title}
              width={36}
              height={36}
              className="rounded object-cover"
            />
            <div className="text-xs">
              <p className="font-medium text-navy-700 truncate max-w-[100px]">
                {conversation.listing.title}
              </p>
              <p className="text-navy-500">{formatPrice(parseFloat(conversation.listing.price))}</p>
            </div>
          </Link>
        )}
      </div>

      {/* Messages */}
      <div className="flex-1 overflow-y-auto card p-4 mb-4 space-y-4">
        {messages.length === 0 && (
          <div className="text-center text-navy-400 text-sm py-8">
            No messages yet. Say hello!
          </div>
        )}

        {messages.map((msg) => {
          const isMe = msg.senderId === session?.user?.id;
          return (
            <div
              key={msg.id}
              className={cn('flex items-end gap-2', isMe ? 'flex-row-reverse' : 'flex-row')}
            >
              {!isMe && (
                <div className="w-7 h-7 rounded-full bg-navy-200 text-navy-700 flex items-center justify-center text-xs font-bold flex-shrink-0">
                  {getInitials(msg.sender.name || 'U').charAt(0)}
                </div>
              )}
              <div className={cn('max-w-[70%]', isMe ? 'items-end' : 'items-start', 'flex flex-col gap-1')}>
                <div
                  className={cn(
                    'px-4 py-2.5 rounded-2xl text-sm leading-relaxed',
                    isMe
                      ? 'bg-navy-700 text-white rounded-br-sm'
                      : 'bg-cream-100 text-navy-800 border border-cream-300 rounded-bl-sm'
                  )}
                >
                  {msg.content}
                </div>
                <span className="text-xs text-navy-400 px-1">
                  {formatRelativeTime(msg.createdAt)}
                </span>
              </div>
            </div>
          );
        })}
        <div ref={messagesEndRef} />
      </div>

      {/* Input */}
      <form onSubmit={handleSend} className="flex gap-3">
        <input
          type="text"
          value={content}
          onChange={(e) => setContent(e.target.value)}
          placeholder="Type a message..."
          className="input-base flex-1"
          maxLength={2000}
          disabled={sending}
        />
        <button
          type="submit"
          disabled={sending || !content.trim()}
          className="btn-primary px-4 py-2.5"
        >
          {sending ? (
            <Loader2 className="h-5 w-5 animate-spin" />
          ) : (
            <Send className="h-5 w-5" />
          )}
        </button>
      </form>
    </div>
  );
}
