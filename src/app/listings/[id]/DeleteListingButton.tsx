'use client';

import { useState } from 'react';
import { useRouter } from 'next/navigation';
import { Trash2, Loader2 } from 'lucide-react';

interface DeleteListingButtonProps {
  listingId: string;
}

export default function DeleteListingButton({ listingId }: DeleteListingButtonProps) {
  const router = useRouter();
  const [confirming, setConfirming] = useState(false);
  const [loading, setLoading] = useState(false);

  const handleDelete = async () => {
    setLoading(true);
    try {
      const res = await fetch(`/api/listings/${listingId}`, {
        method: 'DELETE',
      });
      if (res.ok) {
        router.push('/listings');
        router.refresh();
      }
    } catch {
      setLoading(false);
    }
  };

  if (confirming) {
    return (
      <div className="space-y-2">
        <p className="text-xs text-center text-red-600 font-medium">Are you sure?</p>
        <div className="flex gap-2">
          <button
            onClick={() => setConfirming(false)}
            className="flex-1 py-2 text-sm border border-navy-300 text-navy-600 rounded-lg hover:bg-cream-100 transition-all"
          >
            Cancel
          </button>
          <button
            onClick={handleDelete}
            disabled={loading}
            className="flex-1 py-2 text-sm bg-red-600 text-white rounded-lg hover:bg-red-700 transition-all flex items-center justify-center gap-1"
          >
            {loading ? <Loader2 className="h-4 w-4 animate-spin" /> : (
              <>
                <Trash2 className="h-4 w-4" />
                Delete
              </>
            )}
          </button>
        </div>
      </div>
    );
  }

  return (
    <button
      onClick={() => setConfirming(true)}
      className="w-full py-2 px-4 rounded-lg border-2 border-red-300 text-red-600 text-sm font-medium hover:bg-red-50 transition-all flex items-center justify-center gap-2"
    >
      <Trash2 className="h-4 w-4" />
      Delete Listing
    </button>
  );
}
