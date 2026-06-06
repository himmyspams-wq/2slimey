'use client';

import { useState } from 'react';
import { useRouter, useParams } from 'next/navigation';
import { useSession } from 'next-auth/react';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { Flag, Loader2, CheckCircle2, AlertCircle } from 'lucide-react';
import { reportListingSchema, type ReportListingInput } from '@/lib/validations';

const REASON_LABELS: Record<string, string> = {
  SPAM: 'Spam or repetitive listing',
  COUNTERFEIT: 'Counterfeit or fake product',
  WRONG_BRAND: 'Brand not allowed on this marketplace',
  MISLEADING: 'Misleading or inaccurate description',
  OTHER: 'Other reason',
};

export default function ReportListingPage() {
  const router = useRouter();
  const params = useParams();
  const { data: session } = useSession();
  const [submitted, setSubmitted] = useState(false);
  const [serverError, setServerError] = useState('');

  const {
    register,
    handleSubmit,
    formState: { errors, isSubmitting },
  } = useForm<ReportListingInput>({
    resolver: zodResolver(reportListingSchema),
  });

  if (!session) {
    router.push(`/auth/signin?callbackUrl=/listings/${params.id}/report`);
    return null;
  }

  if (submitted) {
    return (
      <div className="container-main py-12 max-w-lg text-center">
        <div className="card p-10">
          <CheckCircle2 className="h-12 w-12 text-green-600 mx-auto mb-4" />
          <h2 className="font-serif text-2xl font-bold text-navy-800 mb-2">Report Submitted</h2>
          <p className="text-navy-600 text-sm mb-6">
            Thank you for helping keep 2Slimey premium. Our team will review this listing.
          </p>
          <button onClick={() => router.back()} className="btn-secondary">
            Go Back
          </button>
        </div>
      </div>
    );
  }

  const onSubmit = async (data: ReportListingInput) => {
    setServerError('');
    try {
      const res = await fetch(`/api/listings/${params.id}/report`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(data),
      });
      const json = await res.json();
      if (!res.ok) {
        setServerError(json.error || 'Failed to submit report');
        return;
      }
      setSubmitted(true);
    } catch {
      setServerError('An unexpected error occurred');
    }
  };

  return (
    <div className="container-main py-10 max-w-lg">
      <div className="card p-8">
        <div className="flex items-center gap-3 mb-6">
          <div className="p-2 bg-red-100 rounded-lg">
            <Flag className="h-5 w-5 text-red-600" />
          </div>
          <div>
            <h1 className="font-serif text-xl font-bold text-navy-800">Report Listing</h1>
            <p className="text-navy-500 text-sm">Help us maintain marketplace quality</p>
          </div>
        </div>

        {serverError && (
          <div className="flex items-start gap-2 bg-red-50 border border-red-200 rounded-lg p-3 mb-4">
            <AlertCircle className="h-4 w-4 text-red-600 flex-shrink-0 mt-0.5" />
            <p className="text-sm text-red-600">{serverError}</p>
          </div>
        )}

        <form onSubmit={handleSubmit(onSubmit)} className="space-y-4">
          <div>
            <label className="block text-sm font-medium text-navy-700 mb-2">
              Reason for Report <span className="text-red-500">*</span>
            </label>
            <div className="space-y-2">
              {Object.entries(REASON_LABELS).map(([value, label]) => (
                <label key={value} className="flex items-center gap-3 p-3 rounded-lg border border-cream-300 hover:border-navy-400 cursor-pointer transition-all">
                  <input
                    {...register('reason')}
                    type="radio"
                    value={value}
                    className="text-navy-700 focus:ring-navy-500"
                  />
                  <span className="text-sm text-navy-700">{label}</span>
                </label>
              ))}
            </div>
            {errors.reason && (
              <p className="text-xs text-red-500 mt-1">{errors.reason.message}</p>
            )}
          </div>

          <div>
            <label className="block text-sm font-medium text-navy-700 mb-1">
              Additional Details
            </label>
            <textarea
              {...register('details')}
              rows={4}
              placeholder="Provide any additional context to help our team review this listing..."
              className="input-base resize-none"
              maxLength={500}
            />
            {errors.details && (
              <p className="text-xs text-red-500 mt-1">{errors.details.message}</p>
            )}
          </div>

          <div className="flex gap-3 pt-2">
            <button type="button" onClick={() => router.back()} className="btn-secondary flex-1">
              Cancel
            </button>
            <button type="submit" disabled={isSubmitting} className="btn-danger flex-1">
              {isSubmitting ? <Loader2 className="h-5 w-5 animate-spin" /> : (
                <>
                  <Flag className="h-4 w-4" />
                  Submit Report
                </>
              )}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}
