'use client';

import { useState } from 'react';
import { useRouter } from 'next/navigation';
import { useSession } from 'next-auth/react';
import { useForm, Controller } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { AlertCircle, Loader2, DollarSign, MapPin, Package, Info } from 'lucide-react';
import { createListingSchema, type CreateListingInput } from '@/lib/validations';
import { BRAND_CATEGORIES } from '@/lib/brands';
import { getConditionLabel } from '@/lib/utils';
import ImageUpload from '@/components/ImageUpload';

interface UploadedFile {
  url: string;
  key: string;
}

export default function NewListingPage() {
  const router = useRouter();
  const { data: session, status } = useSession();
  const [serverError, setServerError] = useState('');
  const [uploadedImages, setUploadedImages] = useState<UploadedFile[]>([]);

  const {
    register,
    handleSubmit,
    control,
    watch,
    setValue,
    formState: { errors, isSubmitting },
  } = useForm<CreateListingInput>({
    resolver: zodResolver(createListingSchema),
    defaultValues: {
      condition: 7,
      shippingAvailable: false,
      price: 0,
    },
  });

  const conditionValue = watch('condition');
  const shippingAvailable = watch('shippingAvailable');
  const brand = watch('brand');
  const model = watch('model');

  // Auto-suggest title when brand or model changes
  const handleBrandChange = (value: string) => {
    setValue('brand', value as CreateListingInput['brand']);
    if (model) {
      setValue('title', `${value} ${model}`);
    }
  };

  const handleModelChange = (value: string) => {
    setValue('model', value);
    if (brand) {
      setValue('title', `${brand} ${value}`);
    }
  };

  if (status === 'loading') {
    return (
      <div className="flex items-center justify-center min-h-96">
        <Loader2 className="h-8 w-8 animate-spin text-navy-600" />
      </div>
    );
  }

  if (!session) {
    router.push('/auth/signin?callbackUrl=/listings/new');
    return null;
  }

  const onSubmit = async (data: CreateListingInput) => {
    setServerError('');
    try {
      const res = await fetch('/api/listings', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          ...data,
          imageKeys: uploadedImages.map((img) => img.key),
        }),
      });

      const json = await res.json();

      if (!res.ok) {
        setServerError(json.error || 'Failed to create listing. Please try again.');
        return;
      }

      router.push(`/listings/${json.id}`);
    } catch {
      setServerError('An unexpected error occurred. Please try again.');
    }
  };

  const conditionInfo = getConditionLabel(conditionValue || 7);

  return (
    <div className="container-main py-10 max-w-3xl">
      <div className="mb-8">
        <h1 className="font-serif text-3xl font-bold text-navy-800">List Your Reel</h1>
        <p className="text-navy-500 mt-1">Fill in the details to list your reel on ReelMarket.</p>
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
              <label className="block text-sm font-medium text-navy-700 mb-1">
                Brand <span className="text-red-500">*</span>
              </label>
              <select
                {...register('brand')}
                onChange={(e) => handleBrandChange(e.target.value)}
                className="input-base"
              >
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
              <label className="block text-sm font-medium text-navy-700 mb-1">
                Model <span className="text-red-500">*</span>
              </label>
              <input
                {...register('model')}
                onChange={(e) => handleModelChange(e.target.value)}
                type="text"
                placeholder="e.g. Stella 5000"
                className="input-base"
              />
              {errors.model && (
                <p className="text-xs text-red-500 mt-1">{errors.model.message}</p>
              )}
            </div>
          </div>

          <div className="mt-4">
            <label className="block text-sm font-medium text-navy-700 mb-1">
              Listing Title <span className="text-red-500">*</span>
            </label>
            <input
              {...register('title')}
              type="text"
              placeholder="e.g. Shimano Stella 5000 - Excellent Condition"
              className="input-base"
              maxLength={100}
            />
            <p className="text-xs text-navy-400 mt-1">
              A clear, descriptive title helps buyers find your listing.
            </p>
            {errors.title && (
              <p className="text-xs text-red-500 mt-1">{errors.title.message}</p>
            )}
          </div>
        </div>

        {/* Condition */}
        <div className="card p-6">
          <h2 className="font-semibold text-navy-800 mb-4 flex items-center gap-2">
            <Info className="h-5 w-5 text-navy-600" />
            Condition
          </h2>

          <div className="mb-4">
            <div className="flex items-center justify-between mb-2">
              <label className="text-sm font-medium text-navy-700">
                Rating: <span className="text-navy-900 font-bold">{conditionValue}/10</span>
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
                  value={field.value}
                  onChange={(e) => field.onChange(parseInt(e.target.value))}
                  className="w-full accent-navy-700"
                />
              )}
            />
            <div className="flex justify-between text-xs text-navy-400 mt-1">
              <span>1 - Poor</span>
              <span>5 - Good</span>
              <span>10 - Mint</span>
            </div>
          </div>

          <div>
            <label className="block text-sm font-medium text-navy-700 mb-1">
              Condition Description
            </label>
            <textarea
              {...register('conditionDescription')}
              rows={3}
              placeholder="Describe any wear, scratches, repairs, or notable details about the condition..."
              className="input-base resize-none"
              maxLength={500}
            />
            {errors.conditionDescription && (
              <p className="text-xs text-red-500 mt-1">{errors.conditionDescription.message}</p>
            )}
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
              <label className="block text-sm font-medium text-navy-700 mb-1">
                Price <span className="text-red-500">*</span>
              </label>
              <div className="relative">
                <span className="absolute left-3 top-1/2 -translate-y-1/2 text-navy-400 font-medium">$</span>
                <input
                  {...register('price', { valueAsNumber: true })}
                  type="number"
                  min={1}
                  max={100000}
                  step={1}
                  placeholder="0"
                  className="input-base pl-7"
                />
              </div>
              {errors.price && (
                <p className="text-xs text-red-500 mt-1">{errors.price.message}</p>
              )}
            </div>

            <div>
              <label className="block text-sm font-medium text-navy-700 mb-1">
                Location <span className="text-red-500">*</span>
              </label>
              <div className="relative">
                <MapPin className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-navy-400" />
                <input
                  {...register('location')}
                  type="text"
                  placeholder="City, State"
                  className="input-base pl-9"
                  maxLength={100}
                />
              </div>
              {errors.location && (
                <p className="text-xs text-red-500 mt-1">{errors.location.message}</p>
              )}
            </div>
          </div>

          {/* Shipping */}
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
                <label className="block text-sm font-medium text-navy-700 mb-1">
                  Shipping Cost
                </label>
                <div className="relative w-40">
                  <span className="absolute left-3 top-1/2 -translate-y-1/2 text-navy-400">$</span>
                  <input
                    {...register('shippingCost', { valueAsNumber: true })}
                    type="number"
                    min={0}
                    step={0.01}
                    placeholder="0.00"
                    className="input-base pl-7"
                  />
                </div>
                {errors.shippingCost && (
                  <p className="text-xs text-red-500 mt-1">{errors.shippingCost.message}</p>
                )}
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
            placeholder="Describe your reel — its history, any accessories included, reason for selling, etc."
            className="input-base resize-none"
            maxLength={2000}
          />
          {errors.description && (
            <p className="text-xs text-red-500 mt-1">{errors.description.message}</p>
          )}
        </div>

        {/* Images */}
        <div className="card p-6">
          <h2 className="font-semibold text-navy-800 mb-2">Photos</h2>
          <p className="text-navy-500 text-sm mb-4">
            Add up to 8 photos. The first photo will be the main image. High quality photos get more interest.
          </p>
          <ImageUpload onChange={setUploadedImages} maxFiles={8} />
        </div>

        {/* Submit */}
        <div className="flex gap-4">
          <button
            type="button"
            onClick={() => router.back()}
            className="btn-secondary flex-1"
          >
            Cancel
          </button>
          <button
            type="submit"
            disabled={isSubmitting}
            className="btn-primary flex-1 py-3"
          >
            {isSubmitting ? (
              <Loader2 className="h-5 w-5 animate-spin" />
            ) : (
              'Publish Listing'
            )}
          </button>
        </div>
      </form>
    </div>
  );
}
