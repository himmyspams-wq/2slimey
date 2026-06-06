import Link from 'next/link';
import { Mail, Fish } from 'lucide-react';

export default function VerifyRequestPage() {
  return (
    <div className="min-h-[calc(100vh-4rem)] bg-navy-50 flex items-center justify-center px-4 py-12">
      <div className="card p-10 max-w-md w-full text-center">
        <div className="flex items-center justify-center gap-2 mb-6">
          <Fish className="h-7 w-7 text-navy-700" />
          <span className="font-serif text-xl font-bold text-navy-800">2SLIMEY</span>
          <span className="text-gold-500 text-xl font-bold">.</span>
        </div>

        <div className="w-16 h-16 bg-gold-100 rounded-full flex items-center justify-center mx-auto mb-6">
          <Mail className="h-8 w-8 text-gold-600" />
        </div>

        <h1 className="font-serif text-3xl font-bold text-navy-800 mb-3">
          Check Your Email
        </h1>

        <p className="text-navy-600 leading-relaxed mb-2">
          A magic link has been sent to your email address. Click the link in the email to sign in
          to your 2Slimey account.
        </p>

        <p className="text-navy-400 text-sm mt-4">
          The link expires in 24 hours. If you don&apos;t see the email, check your spam folder.
        </p>

        <div className="mt-8 pt-6 border-t border-cream-200">
          <Link
            href="/auth/signin"
            className="text-sm text-navy-600 hover:text-navy-800 font-medium underline"
          >
            Back to sign in
          </Link>
        </div>
      </div>
    </div>
  );
}
