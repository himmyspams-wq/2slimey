'use client';

import { useEffect, useState, Suspense } from 'react';
import { useRouter, useSearchParams } from 'next/navigation';
import { useSession } from 'next-auth/react';
import { Loader2 } from 'lucide-react';

function NewConversationContent() {
  const router = useRouter();
  const searchParams = useSearchParams();
  const { data: session, status } = useSession();
  const [error, setError] = useState('');

  const listingId = searchParams.get('listing');
  const sellerId = searchParams.get('seller');

  useEffect(() => {
    if (status === 'unauthenticated') {
      router.push(`/auth/signin?callbackUrl=/messages/new?listing=${listingId}&seller=${sellerId}`);
      return;
    }

    if (status !== 'authenticated' || !listingId || !sellerId) return;

    if (sellerId === session.user.id) {
      router.push(`/listings/${listingId}`);
      return;
    }

    // Create or find conversation
    fetch('/api/messages', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        content: 'Hi, I\'m interested in your listing. Is it still available?',
        listingId,
        recipientId: sellerId,
      }),
    })
      .then((r) => r.json())
      .then((data) => {
        if (data.conversationId) {
          router.replace(`/messages/${data.conversationId}`);
        } else {
          setError(data.error || 'Failed to start conversation');
        }
      })
      .catch(() => setError('Failed to start conversation'));
  }, [status, session, listingId, sellerId, router]);

  if (error) {
    return (
      <div className="container-main py-12 text-center">
        <p className="text-red-600 mb-4">{error}</p>
        <button onClick={() => router.back()} className="btn-secondary">
          Go Back
        </button>
      </div>
    );
  }

  return (
    <div className="flex items-center justify-center min-h-96">
      <div className="text-center">
        <Loader2 className="h-8 w-8 animate-spin text-navy-600 mx-auto mb-3" />
        <p className="text-navy-500 text-sm">Starting conversation...</p>
      </div>
    </div>
  );
}

export default function NewConversationPage() {
  return (
    <Suspense fallback={
      <div className="flex items-center justify-center min-h-96">
        <Loader2 className="h-8 w-8 animate-spin text-navy-600" />
      </div>
    }>
      <NewConversationContent />
    </Suspense>
  );
}
