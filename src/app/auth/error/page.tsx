'use client';

import { Suspense } from 'react';
import Link from 'next/link';
import { useSearchParams } from 'next/navigation';
import { Fish, AlertTriangle } from 'lucide-react';

const ERROR_MESSAGES: Record<string, { title: string; description: string }> = {
  Configuration: {
    title: 'Server Configuration Error',
    description:
      'There is a problem with the server configuration. Please contact support if this persists.',
  },
  AccessDenied: {
    title: 'Access Denied',
    description: 'You do not have permission to sign in. Please contact support.',
  },
  Verification: {
    title: 'Verification Failed',
    description:
      'The magic link has expired or has already been used. Please request a new one.',
  },
  Default: {
    title: 'Authentication Error',
    description:
      'An error occurred during authentication. Please try again or contact support.',
  },
};

function ErrorContent() {
  const searchParams = useSearchParams();
  const errorCode = searchParams.get('error') || 'Default';
  const errorInfo = ERROR_MESSAGES[errorCode] || ERROR_MESSAGES.Default;

  return (
    <div className="card p-10 max-w-md w-full text-center">
      <div className="flex items-center justify-center gap-2 mb-6">
        <Fish className="h-7 w-7 text-navy-700" />
        <span className="font-serif text-xl font-bold text-navy-800">REELMARKET</span>
        <span className="text-gold-500 text-xl font-bold">.</span>
      </div>

      <div className="w-16 h-16 bg-red-100 rounded-full flex items-center justify-center mx-auto mb-6">
        <AlertTriangle className="h-8 w-8 text-red-600" />
      </div>

      <h1 className="font-serif text-2xl font-bold text-navy-800 mb-3">
        {errorInfo.title}
      </h1>

      <p className="text-navy-600 text-sm leading-relaxed">{errorInfo.description}</p>

      {errorCode !== 'Default' && (
        <p className="text-navy-400 text-xs mt-2">Error code: {errorCode}</p>
      )}

      <div className="mt-8 space-y-3">
        <Link href="/auth/signin" className="btn-primary w-full">
          Try Again
        </Link>
        <Link href="/" className="btn-secondary w-full">
          Go Home
        </Link>
      </div>
    </div>
  );
}

export default function AuthErrorPage() {
  return (
    <div className="min-h-[calc(100vh-4rem)] bg-navy-50 flex items-center justify-center px-4 py-12">
      <Suspense fallback={<div className="card p-10 max-w-md w-full animate-pulse h-64" />}>
        <ErrorContent />
      </Suspense>
    </div>
  );
}
