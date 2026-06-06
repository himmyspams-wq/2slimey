'use client';

import { useState, useEffect } from 'react';
import { useRouter, useParams } from 'next/navigation';
import { useSession } from 'next-auth/react';
import { useForm, Controller } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { AlertCircle, Loader2, DollarSign, MapPin, Package } from 'lucide-react';
import { updateListingSchema, type UpdateListingInput } from '@/lib/validations';
import { BRAND_CATEGORIES } from '@/lib/brands';
import { getConditionLabel } from '@/lib/utils';

export default function EditListingPage() {
  const router = useRouter();
  const params = useParams();
  const { data: session, status } = useSession();
  const [loading, setLoading] = useState(true);
  const [serverError, setServerError] = useState('');
  const [notFound, setNotFound] = useState(false);

  const {
    register,
    handleSubmit,
    control,
    watch,
    reset,
    formState: { errors, isSubmitting },
  } = useForm<UpdateListingInput>({
    resolver: zodResolver(updateListingSchema),
  });

  const conditionValue = watch('condition');
  const shippingAvailable = watch('shippingAvailable');
  const conditionInfo = getConditionLabel(conditionValue || 7);

  useEffect(() => {
    if (status === 'unauthenticated') {
      router.push(`/auth/signin?callbackUrl=/listings/${params.id}/edit`);
      return;
    }
    if (status !== 'authenticated') return;

    fetch(`/api/listings/${params.id}`)
      .then((r) => r.json())
      .then((data) => {
        if (!data || data.error) {
          setNotFound(true);
          return;
        }
        // Check ownership
        if (data.userId !== session?.user?.id && !session?.user?.isAdmin) {
          router.push(`/listings/${params.id}`);
          return;
        }
        reset({
          title: data.title,
          brand: data.brand,
          model: data.model,
          condition: data.condition,
          conditionDescription: data.conditionDescription || '',
          price: parseFloat(data.price),
          location: data.location,
          shippingAvailable: data.shippingAvailable,
          shippingCost: data.shippingCost ? parseFloat(data.shippingCost) : undefined,
          description: data.description || '',
        });
        setLoading(false);
      })
      .catch(() => setNotFound(true));
  }, [params.id, session, status, reset, router]);

  if (loading || status === 'loading') {
    return (
      <div className="flex items-center justify-center min-h-96">
        <Loader2 className="h-8 w-8 animate-spin text-navy-600" />
      </div>
    );
  }

  if (notFound) {
    return (
      <div className="container-main py-12 text-center">
        <p className="text-navy-600">Listing not found or you don&apos;t have permission to edit it.</p>
      </div>
    );
  }

  const onSubmit = async (data: UpdateListingInput) => {
    setServerError('');
    try {
      const res = await fetch(`/api/listings/${params.id}`, {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(data),
      });

      const json = await res.json();

      if (!res.ok) {
        setServerError(json.error || 'Failed to update listing');
        return;
      }

      router.push(`/listings/${params.id}`);
      router.refresh();
    } catch {
      setServerError('An unexpected error occurred');
    }
  };

  return (
    <div className="container-main py-10 max-w-3xl">
      <div className="mb-8">
        <h1 className="font-serif text-3xl font-bold text-navy-800">Edit Listing</h1>
        <p className="text-navy-500 mt-1">Update your listing details.</p>
      </div>

      {serverError && (
        <div className="flex items-start gap-2 bg-red-50 border border-red-200 rounded-lg p-4 mb-6">
          <AlertCircle className="h-5 w-5 text-red-600 flex-shrink-0 mt-0.5" />
          <p className="text-sm text-red-600">{serverError}</p>
        </div>
      )}

      <form onSubmit={handleSubmit(onSubmit)} className="space-y-8">
        {/* Brand & Model */}
        <div className="card p-6">
          <h2 className="font-semibold text-navy-800 mb-4 flex items-center gap-2">
            <Package className="h-5 w-5 text-navy-600" />
            Reel Details
          </h2>
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            <div>
              <label className="block text-sm font-medium text-navy-700 mb-1">Brand</label>
              <select {...register('brand')} className="input-base">
                <option value="">Select a brand...</option>
                <optgroup label="Conventional">
                  {BRAND_CATEGORIES.conventional.map((b) => (
                    <option key={b} value={b}>{b}</option>
                  ))}
                </optgroup>
                <optgroup label="Fly Fishing">
                  {BRAND_CATEGORIES.fly.map((b) => (
                    <option key={b} value={b}>{b}</option>
                  ))}
                </optgroup>
              </select>
              {errors.brand && (
                <p className="text-xs text-red-500 mt-1">{errors.brand.message}</p>
              )}
            </div>

            <div>
              <label className="block text-sm font-medium text-navy-700 mb-1">Model</label>
              <input
                {...register('model')}
                type="text"
                className="input-base"
              />
              {errors.model && (
                <p className="text-xs text-red-500 mt-1">{errors.model.message}</p>
              )}
            </div>
          </div>

          <div className="mt-4">
            <label className="block text-sm font-medium text-navy-700 mb-1">Listing Title</label>
            <input
              {...register('title')}
              type="text"
              className="input-base"
              maxLength={100}
            />
            {errors.title && (
              <p className="text-xs text-red-500 mt-1">{errors.title.message}</p>
            )}
          </div>
        </div>

        {/* Condition */}
        <div className="card p-6">
          <h2 className="font-semibold text-navy-800 mb-4">Condition</h2>
          <div className="mb-4">
            <div className="flex items-center justify-between mb-2">
              <label className="text-sm font-medium text-navy-700">
                Rating: <span className="font-bold">{conditionValue || 7}/10</span>
              </label>
              <span className={`text-xs font-semibold px-2 py-0.5 rounded-full ${conditionInfo.colorClass}`}>
                {conditionInfo.label}
              </span>
            </div>
            <Controller
              name="condition"
              control={control}
              render={({ field }) => (
                <input
                  type="range"
                  min={1}
                  max={10}
                  step={1}
                  value={field.value || 7}
                  onChange={(e) => field.onChange(parseInt(e.target.value))}
                  className="w-full accent-navy-700"
                />
              )}
            />
          </div>

          <div>
            <label className="block text-sm font-medium text-navy-700 mb-1">
              Condition Description
            </label>
            <textarea
              {...register('conditionDescription')}
              rows={3}
              className="input-base resize-none"
              maxLength={500}
            />
          </div>
        </div>

        {/* Price & Location */}
        <div className="card p-6">
          <h2 className="font-semibold text-navy-800 mb-4 flex items-center gap-2">
            <DollarSign className="h-5 w-5 text-navy-600" />
            Pricing & Location
          </h2>
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            <div>
              <label className="block text-sm font-medium text-navy-700 mb-1">Price</label>
              <div className="relative">
                <span className="absolute left-3 top-1/2 -translate-y-1/2 text-navy-400">$</span>
                <input
                  {...register('price', { valueAsNumber: true })}
                  type="number"
                  min={1}
                  className="input-base pl-7"
                />
              </div>
              {errors.price && (
                <p className="text-xs text-red-500 mt-1">{errors.price.message}</p>
              )}
            </div>

            <div>
              <label className="block text-sm font-medium text-navy-700 mb-1">Location</label>
              <div className="relative">
                <MapPin className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-navy-400" />
                <input
                  {...register('location')}
                  type="text"
                  className="input-base pl-9"
                />
              </div>
              {errors.location && (
                <p className="text-xs text-red-500 mt-1">{errors.location.message}</p>
              )}
            </div>
          </div>

          <div className="mt-4">
            <label className="flex items-center gap-3 cursor-pointer">
              <input
                {...register('shippingAvailable')}
                type="checkbox"
                className="w-4 h-4 rounded border-navy-300 text-navy-700 focus:ring-navy-500"
              />
              <span className="text-sm font-medium text-navy-700">Shipping available</span>
            </label>
            {shippingAvailable && (
              <div className="mt-3 ml-7">
                <div className="relative w-40">
                  <span className="absolute left-3 top-1/2 -translate-y-1/2 text-navy-400">$</span>
                  <input
                    {...register('shippingCost', { valueAsNumber: true })}
                    type="number"
                    min={0}
                    step={0.01}
                    className="input-base pl-7"
                  />
                </div>
              </div>
            )}
          </div>
        </div>

        {/* Description */}
        <div className="card p-6">
          <h2 className="font-semibold text-navy-800 mb-4">Description</h2>
          <textarea
            {...register('description')}
            rows={5}
            className="input-base resize-none"
            maxLength={2000}
          />
        </div>

        <div className="flex gap-4">
          <button type="button" onClick={() => router.back()} className="btn-secondary flex-1">
            Cancel
          </button>
          <button type="submit" disabled={isSubmitting} className="btn-primary flex-1 py-3">
            {isSubmitting ? <Loader2 className="h-5 w-5 animate-spin" /> : 'Save Changes'}
          </button>
        </div>
      </form>
    </div>
  );
}
