'use client';

import { useState, Suspense } from 'react';
import { signIn } from 'next-auth/react';
import { useRouter, useSearchParams } from 'next/navigation';
import Link from 'next/link';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { z } from 'zod';
import { Fish, Loader2, Mail, Eye, EyeOff, AlertCircle } from 'lucide-react';

const credentialsSchema = z.object({
  email: z.string().email('Please enter a valid email'),
  password: z.string().min(1, 'Password is required'),
});

const magicLinkSchema = z.object({
  email: z.string().email('Please enter a valid email'),
});

type CredentialsForm = z.infer<typeof credentialsSchema>;
type MagicLinkForm = z.infer<typeof magicLinkSchema>;

function SignInContent() {
  const router = useRouter();
  const searchParams = useSearchParams();
  const callbackUrl = searchParams.get('callbackUrl') || '/';
  const [mode, setMode] = useState<'credentials' | 'magic'>('credentials');
  const [showPassword, setShowPassword] = useState(false);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');
  const [magicSent, setMagicSent] = useState(false);

  const credForm = useForm<CredentialsForm>({
    resolver: zodResolver(credentialsSchema),
  });

  const magicForm = useForm<MagicLinkForm>({
    resolver: zodResolver(magicLinkSchema),
  });

  const onCredentialsSubmit = async (data: CredentialsForm) => {
    setLoading(true);
    setError('');
    try {
      const result = await signIn('credentials', {
        email: data.email,
        password: data.password,
        redirect: false,
        callbackUrl,
      });

      if (result?.error) {
        setError('Invalid email or password. Please try again.');
      } else if (result?.ok) {
        router.push(callbackUrl);
        router.refresh();
      }
    } catch {
      setError('An unexpected error occurred. Please try again.');
    } finally {
      setLoading(false);
    }
  };

  const onMagicLinkSubmit = async (data: MagicLinkForm) => {
    setLoading(true);
    setError('');
    try {
      const result = await signIn('email', {
        email: data.email,
        redirect: false,
        callbackUrl,
      });
      if (result?.error) {
        setError('Could not send magic link. Please check your email and try again.');
      } else {
        setMagicSent(true);
      }
    } catch {
      setError('An unexpected error occurred. Please try again.');
    } finally {
      setLoading(false);
    }
  };

  if (magicSent) {
    return (
      <div className="text-center">
        <div className="bg-green-50 border border-green-200 rounded-xl p-8 max-w-md mx-auto">
          <Mail className="h-12 w-12 text-green-600 mx-auto mb-4" />
          <h2 className="font-serif text-2xl font-bold text-navy-800 mb-2">Check Your Email</h2>
          <p className="text-navy-600 text-sm">
            We sent you a magic link. Click it to sign in. The link expires in 24 hours.
          </p>
          <button
            onClick={() => setMagicSent(false)}
            className="mt-6 text-navy-500 text-sm hover:text-navy-700 underline"
          >
            Back to sign in
          </button>
        </div>
      </div>
    );
  }

  return (
    <div className="card p-8 max-w-md w-full">
      {/* Header */}
      <div className="text-center mb-8">
        <div className="flex items-center justify-center gap-2 mb-4">
          <Fish className="h-8 w-8 text-navy-700" />
          <span className="font-serif text-2xl font-bold text-navy-800">2SLIMEY</span>
          <span className="text-gold-500 text-2xl font-bold">.</span>
        </div>
        <h1 className="font-serif text-3xl font-bold text-navy-800">Welcome back</h1>
        <p className="text-navy-500 text-sm mt-1">Sign in to your account</p>
      </div>

      {/* Mode Toggle */}
      <div className="flex rounded-lg border border-cream-300 p-1 mb-6 bg-cream-50">
        <button
          onClick={() => { setMode('credentials'); setError(''); }}
          className={`flex-1 py-2 px-3 rounded-md text-sm font-medium transition-all ${
            mode === 'credentials'
              ? 'bg-white text-navy-800 shadow-sm border border-cream-300'
              : 'text-navy-500 hover:text-navy-700'
          }`}
        >
          Password
        </button>
        <button
          onClick={() => { setMode('magic'); setError(''); }}
          className={`flex-1 py-2 px-3 rounded-md text-sm font-medium transition-all ${
            mode === 'magic'
              ? 'bg-white text-navy-800 shadow-sm border border-cream-300'
              : 'text-navy-500 hover:text-navy-700'
          }`}
        >
          Magic Link
        </button>
      </div>

      {/* Error */}
      {error && (
        <div className="flex items-start gap-2 bg-red-50 border border-red-200 rounded-lg p-3 mb-4">
          <AlertCircle className="h-4 w-4 text-red-600 flex-shrink-0 mt-0.5" />
          <p className="text-sm text-red-600">{error}</p>
        </div>
      )}

      {/* Credentials Form */}
      {mode === 'credentials' && (
        <form onSubmit={credForm.handleSubmit(onCredentialsSubmit)} className="space-y-4">
          <div>
            <label className="block text-sm font-medium text-navy-700 mb-1">Email</label>
            <input
              {...credForm.register('email')}
              type="email"
              placeholder="you@example.com"
              className="input-base"
              autoComplete="email"
            />
            {credForm.formState.errors.email && (
              <p className="text-xs text-red-500 mt-1">{credForm.formState.errors.email.message}</p>
            )}
          </div>

          <div>
            <label className="block text-sm font-medium text-navy-700 mb-1">Password</label>
            <div className="relative">
              <input
                {...credForm.register('password')}
                type={showPassword ? 'text' : 'password'}
                placeholder="Your password"
                className="input-base pr-10"
                autoComplete="current-password"
              />
              <button
                type="button"
                onClick={() => setShowPassword(!showPassword)}
                className="absolute right-3 top-1/2 -translate-y-1/2 text-navy-400 hover:text-navy-600"
              >
                {showPassword ? <EyeOff className="h-4 w-4" /> : <Eye className="h-4 w-4" />}
              </button>
            </div>
            {credForm.formState.errors.password && (
              <p className="text-xs text-red-500 mt-1">{credForm.formState.errors.password.message}</p>
            )}
          </div>

          <button type="submit" disabled={loading} className="btn-primary w-full py-3">
            {loading ? <Loader2 className="h-5 w-5 animate-spin" /> : 'Sign In'}
          </button>
        </form>
      )}

      {/* Magic Link Form */}
      {mode === 'magic' && (
        <form onSubmit={magicForm.handleSubmit(onMagicLinkSubmit)} className="space-y-4">
          <div>
            <label className="block text-sm font-medium text-navy-700 mb-1">Email</label>
            <input
              {...magicForm.register('email')}
              type="email"
              placeholder="you@example.com"
              className="input-base"
              autoComplete="email"
            />
            {magicForm.formState.errors.email && (
              <p className="text-xs text-red-500 mt-1">{magicForm.formState.errors.email.message}</p>
            )}
          </div>
          <p className="text-xs text-navy-400">
            We&apos;ll email you a magic link for instant, password-free sign in.
          </p>
          <button type="submit" disabled={loading} className="btn-primary w-full py-3">
            {loading ? (
              <Loader2 className="h-5 w-5 animate-spin" />
            ) : (
              <>
                <Mail className="h-4 w-4" />
                Send Magic Link
              </>
            )}
          </button>
        </form>
      )}

      <div className="mt-6 text-center">
        <p className="text-sm text-navy-500">
          Don&apos;t have an account?{' '}
          <Link href="/auth/register" className="text-navy-700 font-semibold hover:underline">
            Sign up free
          </Link>
        </p>
      </div>
    </div>
  );
}

export default function SignInPage() {
  return (
    <div className="min-h-[calc(100vh-4rem)] bg-navy-50 flex items-center justify-center px-4 py-12">
      <Suspense fallback={<div className="card p-8 max-w-md w-full animate-pulse h-96" />}>
        <SignInContent />
      </Suspense>
    </div>
  );
}
