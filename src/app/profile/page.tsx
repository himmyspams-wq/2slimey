'use client';

import { useState, useEffect } from 'react';
import { useSession } from 'next-auth/react';
import { useRouter } from 'next/navigation';
import Image from 'next/image';
import Link from 'next/link';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { Loader2, Edit2, CheckCircle2, AlertCircle, MapPin, User } from 'lucide-react';
import { updateProfileSchema, type UpdateProfileInput } from '@/lib/validations';
import { formatRelativeTime, getInitials } from '@/lib/utils';
import ListingCard from '@/components/ListingCard';

interface UserProfile {
  id: string;
  name: string | null;
  email: string | null;
  image: string | null;
  username: string | null;
  location: string | null;
  bio: string | null;
  isVerified: boolean;
  isAdmin: boolean;
  createdAt: string;
  listings: Array<{
    id: string;
    title: string;
    brand: string;
    model: string;
    condition: number;
    price: string;
    location: string;
    shippingAvailable: boolean;
    status: string;
    createdAt: string;
    images: Array<{ url: string; order: number }>;
    user: { id: string; name: string | null; image: string | null };
  }>;
}

export default function ProfilePage() {
  const { data: session, status } = useSession();
  const router = useRouter();
  const [profile, setProfile] = useState<UserProfile | null>(null);
  const [loading, setLoading] = useState(true);
  const [editing, setEditing] = useState(false);
  const [saveError, setSaveError] = useState('');
  const [saveSuccess, setSaveSuccess] = useState(false);

  const { register, handleSubmit, reset, formState: { errors, isSubmitting } } = useForm<UpdateProfileInput>({
    resolver: zodResolver(updateProfileSchema),
  });

  useEffect(() => {
    if (status === 'unauthenticated') {
      router.push('/auth/signin?callbackUrl=/profile');
      return;
    }
    if (status !== 'authenticated') return;

    fetch('/api/users/profile')
      .then((r) => r.json())
      .then((data) => {
        setProfile(data);
        reset({
          name: data.name || '',
          username: data.username || '',
          location: data.location || '',
          bio: data.bio || '',
        });
        setLoading(false);
      })
      .catch(() => setLoading(false));
  }, [status, reset, router]);

  const onSubmit = async (data: UpdateProfileInput) => {
    setSaveError('');
    setSaveSuccess(false);
    try {
      const res = await fetch('/api/users/profile', {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(data),
      });
      const json = await res.json();
      if (!res.ok) {
        setSaveError(json.error || 'Failed to save changes');
        return;
      }
      setProfile((prev) => prev ? { ...prev, ...json } : json);
      setSaveSuccess(true);
      setEditing(false);
      setTimeout(() => setSaveSuccess(false), 3000);
    } catch {
      setSaveError('An unexpected error occurred');
    }
  };

  if (loading || status === 'loading') {
    return (
      <div className="flex items-center justify-center min-h-96">
        <Loader2 className="h-8 w-8 animate-spin text-navy-600" />
      </div>
    );
  }

  if (!profile) return null;

  const activeListings = profile.listings?.filter((l) => l.status === 'ACTIVE') || [];

  return (
    <div className="container-main py-8 max-w-4xl">
      <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
        {/* Profile Card */}
        <div className="md:col-span-1">
          <div className="card p-6 text-center">
            {profile.image ? (
              <Image
                src={profile.image}
                alt={profile.name || 'Profile'}
                width={80}
                height={80}
                className="rounded-full mx-auto mb-4"
              />
            ) : (
              <div className="w-20 h-20 rounded-full bg-navy-700 text-white flex items-center justify-center text-2xl font-bold mx-auto mb-4">
                {getInitials(profile.name || profile.email || 'U')}
              </div>
            )}
            <h1 className="font-serif text-xl font-bold text-navy-800">
              {profile.name || 'Anonymous'}
            </h1>
            {profile.username && (
              <p className="text-navy-500 text-sm">@{profile.username}</p>
            )}
            {profile.location && (
              <div className="flex items-center justify-center gap-1 text-navy-400 text-sm mt-1">
                <MapPin className="h-3 w-3" />
                <span>{profile.location}</span>
              </div>
            )}
            <div className="mt-3 pt-3 border-t border-cream-200">
              <p className="text-xs text-navy-400">
                Member {formatRelativeTime(profile.createdAt)}
              </p>
              <p className="text-xs text-navy-400 mt-1">
                {activeListings.length} active listing{activeListings.length !== 1 ? 's' : ''}
              </p>
            </div>
            <button
              onClick={() => setEditing(!editing)}
              className="btn-secondary w-full mt-4 py-2 text-sm"
            >
              <Edit2 className="h-4 w-4" />
              {editing ? 'Cancel' : 'Edit Profile'}
            </button>
          </div>
        </div>

        {/* Edit Form / Profile Details */}
        <div className="md:col-span-2">
          {editing ? (
            <div className="card p-6">
              <h2 className="font-semibold text-navy-800 mb-4 flex items-center gap-2">
                <User className="h-5 w-5 text-navy-600" />
                Edit Profile
              </h2>

              {saveError && (
                <div className="flex items-start gap-2 bg-red-50 border border-red-200 rounded-lg p-3 mb-4">
                  <AlertCircle className="h-4 w-4 text-red-600 flex-shrink-0 mt-0.5" />
                  <p className="text-sm text-red-600">{saveError}</p>
                </div>
              )}

              <form onSubmit={handleSubmit(onSubmit)} className="space-y-4">
                <div>
                  <label className="block text-sm font-medium text-navy-700 mb-1">Full Name</label>
                  <input {...register('name')} type="text" className="input-base" />
                  {errors.name && <p className="text-xs text-red-500 mt-1">{errors.name.message}</p>}
                </div>

                <div>
                  <label className="block text-sm font-medium text-navy-700 mb-1">Username</label>
                  <div className="relative">
                    <span className="absolute left-3 top-1/2 -translate-y-1/2 text-navy-400 text-sm">@</span>
                    <input {...register('username')} type="text" className="input-base pl-7" />
                  </div>
                  {errors.username && <p className="text-xs text-red-500 mt-1">{errors.username.message}</p>}
                </div>

                <div>
                  <label className="block text-sm font-medium text-navy-700 mb-1">Location</label>
                  <div className="relative">
                    <MapPin className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-navy-400" />
                    <input {...register('location')} type="text" placeholder="City, State" className="input-base pl-9" />
                  </div>
                  {errors.location && <p className="text-xs text-red-500 mt-1">{errors.location.message}</p>}
                </div>

                <div>
                  <label className="block text-sm font-medium text-navy-700 mb-1">Bio</label>
                  <textarea {...register('bio')} rows={4} placeholder="Tell the community about yourself and your fishing style..." className="input-base resize-none" maxLength={500} />
                  {errors.bio && <p className="text-xs text-red-500 mt-1">{errors.bio.message}</p>}
                </div>

                <div className="flex gap-3">
                  <button type="button" onClick={() => setEditing(false)} className="btn-secondary flex-1">
                    Cancel
                  </button>
                  <button type="submit" disabled={isSubmitting} className="btn-primary flex-1">
                    {isSubmitting ? <Loader2 className="h-5 w-5 animate-spin" /> : 'Save Changes'}
                  </button>
                </div>
              </form>
            </div>
          ) : (
            <div className="card p-6">
              <h2 className="font-semibold text-navy-800 mb-4">About</h2>
              {profile.bio ? (
                <p className="text-navy-600 text-sm leading-relaxed">{profile.bio}</p>
              ) : (
                <p className="text-navy-400 text-sm italic">No bio yet.</p>
              )}
              <div className="mt-4 pt-4 border-t border-cream-200 grid grid-cols-2 gap-4">
                <div>
                  <p className="text-xs text-navy-400 uppercase tracking-wider mb-1">Email</p>
                  <p className="text-sm text-navy-700">{profile.email}</p>
                </div>
                {profile.username && (
                  <div>
                    <p className="text-xs text-navy-400 uppercase tracking-wider mb-1">Username</p>
                    <p className="text-sm text-navy-700">@{profile.username}</p>
                  </div>
                )}
              </div>
            </div>
          )}

          {saveSuccess && (
            <div className="flex items-center gap-2 bg-green-50 border border-green-200 rounded-lg p-3 mt-4">
              <CheckCircle2 className="h-4 w-4 text-green-600" />
              <p className="text-sm text-green-700">Profile updated successfully!</p>
            </div>
          )}
        </div>
      </div>

      {/* My Listings */}
      {activeListings.length > 0 && (
        <div className="mt-10">
          <h2 className="font-serif text-2xl font-bold text-navy-800 mb-4">My Active Listings</h2>
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-5">
            {activeListings.map((listing) => (
              <ListingCard key={listing.id} listing={listing} />
            ))}
          </div>
        </div>
      )}

      {activeListings.length === 0 && (
        <div className="mt-10 card p-8 text-center">
          <p className="text-navy-500 text-sm mb-4">You don&apos;t have any active listings.</p>
          <Link href="/listings/new" className="btn-primary">
            List Your First Reel
          </Link>
        </div>
      )}
    </div>
  );
}
