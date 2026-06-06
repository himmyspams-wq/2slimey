'use client';

import { useState } from 'react';
import Link from 'next/link';
import Image from 'next/image';
import { useSession, signOut } from 'next-auth/react';
import {
  Fish,
  Menu,
  X,
  MessageSquare,
  User,
  LogOut,
  Plus,
  ShieldCheck,
  ChevronDown,
} from 'lucide-react';
import { cn, getInitials } from '@/lib/utils';

export default function Navbar() {
  const { data: session } = useSession();
  const [mobileOpen, setMobileOpen] = useState(false);
  const [dropdownOpen, setDropdownOpen] = useState(false);

  return (
    <header className="sticky top-0 z-50 bg-white/95 backdrop-blur-sm border-b border-cream-300 shadow-sm">
      <nav className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="flex items-center justify-between h-16">
          {/* Logo */}
          <Link
            href="/"
            className="flex items-center gap-2 group"
            onClick={() => setMobileOpen(false)}
          >
            <div className="flex items-center gap-1">
              <Fish className="h-7 w-7 text-navy-700 group-hover:text-gold-600 transition-colors" />
              <span className="font-serif text-2xl font-bold text-navy-800 tracking-tight">
                2SLIMEY
              </span>
              <span className="text-gold-500 text-2xl font-bold leading-none mt-1">.</span>
            </div>
          </Link>

          {/* Desktop Nav */}
          <div className="hidden md:flex items-center gap-6">
            <Link
              href="/listings"
              className="text-sm font-medium text-navy-600 hover:text-navy-800 transition-colors"
            >
              Browse
            </Link>
            <Link
              href="/listings/new"
              className="text-sm font-medium text-navy-600 hover:text-navy-800 transition-colors flex items-center gap-1"
            >
              <Plus className="h-4 w-4" />
              Sell
            </Link>
          </div>

          {/* Desktop Auth */}
          <div className="hidden md:flex items-center gap-3">
            {session ? (
              <>
                <Link
                  href="/messages"
                  className="relative p-2 text-navy-600 hover:text-navy-800 hover:bg-cream-100 rounded-lg transition-all"
                  title="Messages"
                >
                  <MessageSquare className="h-5 w-5" />
                </Link>

                {/* User Dropdown */}
                <div className="relative">
                  <button
                    onClick={() => setDropdownOpen(!dropdownOpen)}
                    className="flex items-center gap-2 p-1.5 rounded-lg hover:bg-cream-100 transition-all"
                    onBlur={() => setTimeout(() => setDropdownOpen(false), 150)}
                  >
                    {session.user.image ? (
                      <Image
                        src={session.user.image}
                        alt={session.user.name || 'User'}
                        width={32}
                        height={32}
                        className="rounded-full"
                      />
                    ) : (
                      <div className="w-8 h-8 rounded-full bg-navy-700 text-white flex items-center justify-center text-xs font-bold">
                        {getInitials(session.user.name || session.user.email || 'U')}
                      </div>
                    )}
                    <ChevronDown className="h-4 w-4 text-navy-400" />
                  </button>

                  {dropdownOpen && (
                    <div className="absolute right-0 mt-2 w-52 bg-white rounded-xl shadow-lg border border-cream-300 py-1 z-50">
                      <div className="px-4 py-2 border-b border-cream-200">
                        <p className="text-sm font-semibold text-navy-800 truncate">
                          {session.user.name || 'User'}
                        </p>
                        <p className="text-xs text-navy-400 truncate">{session.user.email}</p>
                      </div>
                      <Link
                        href="/profile"
                        className="flex items-center gap-2 px-4 py-2 text-sm text-navy-700 hover:bg-cream-100 transition-colors"
                        onClick={() => setDropdownOpen(false)}
                      >
                        <User className="h-4 w-4" />
                        My Profile
                      </Link>
                      <Link
                        href="/listings?seller=me"
                        className="flex items-center gap-2 px-4 py-2 text-sm text-navy-700 hover:bg-cream-100 transition-colors"
                        onClick={() => setDropdownOpen(false)}
                      >
                        <Fish className="h-4 w-4" />
                        My Listings
                      </Link>
                      {session.user.isAdmin && (
                        <Link
                          href="/admin"
                          className="flex items-center gap-2 px-4 py-2 text-sm text-navy-700 hover:bg-cream-100 transition-colors"
                          onClick={() => setDropdownOpen(false)}
                        >
                          <ShieldCheck className="h-4 w-4" />
                          Admin Panel
                        </Link>
                      )}
                      <div className="border-t border-cream-200 mt-1">
                        <button
                          onClick={() => {
                            setDropdownOpen(false);
                            signOut({ callbackUrl: '/' });
                          }}
                          className="flex items-center gap-2 w-full px-4 py-2 text-sm text-red-600 hover:bg-red-50 transition-colors"
                        >
                          <LogOut className="h-4 w-4" />
                          Sign Out
                        </button>
                      </div>
                    </div>
                  )}
                </div>
              </>
            ) : (
              <>
                <Link href="/auth/signin" className="btn-secondary py-2 px-4 text-sm">
                  Sign In
                </Link>
                <Link href="/auth/register" className="btn-primary py-2 px-4 text-sm">
                  Sign Up
                </Link>
              </>
            )}
          </div>

          {/* Mobile menu button */}
          <button
            className="md:hidden p-2 rounded-lg text-navy-600 hover:bg-cream-100 transition-colors"
            onClick={() => setMobileOpen(!mobileOpen)}
            aria-label="Toggle menu"
          >
            {mobileOpen ? <X className="h-6 w-6" /> : <Menu className="h-6 w-6" />}
          </button>
        </div>

        {/* Mobile Menu */}
        {mobileOpen && (
          <div className="md:hidden border-t border-cream-200 py-4 space-y-2">
            <Link
              href="/listings"
              className="block px-4 py-2 text-sm font-medium text-navy-700 hover:bg-cream-100 rounded-lg"
              onClick={() => setMobileOpen(false)}
            >
              Browse Listings
            </Link>
            <Link
              href="/listings/new"
              className="block px-4 py-2 text-sm font-medium text-navy-700 hover:bg-cream-100 rounded-lg"
              onClick={() => setMobileOpen(false)}
            >
              Sell a Reel
            </Link>

            {session ? (
              <>
                <Link
                  href="/messages"
                  className="block px-4 py-2 text-sm font-medium text-navy-700 hover:bg-cream-100 rounded-lg"
                  onClick={() => setMobileOpen(false)}
                >
                  Messages
                </Link>
                <Link
                  href="/profile"
                  className="block px-4 py-2 text-sm font-medium text-navy-700 hover:bg-cream-100 rounded-lg"
                  onClick={() => setMobileOpen(false)}
                >
                  My Profile
                </Link>
                {session.user.isAdmin && (
                  <Link
                    href="/admin"
                    className="block px-4 py-2 text-sm font-medium text-navy-700 hover:bg-cream-100 rounded-lg"
                    onClick={() => setMobileOpen(false)}
                  >
                    Admin Panel
                  </Link>
                )}
                <button
                  onClick={() => {
                    setMobileOpen(false);
                    signOut({ callbackUrl: '/' });
                  }}
                  className="block w-full text-left px-4 py-2 text-sm font-medium text-red-600 hover:bg-red-50 rounded-lg"
                >
                  Sign Out
                </button>
              </>
            ) : (
              <div className="flex gap-3 px-4 pt-2">
                <Link
                  href="/auth/signin"
                  className="btn-secondary flex-1 text-center"
                  onClick={() => setMobileOpen(false)}
                >
                  Sign In
                </Link>
                <Link
                  href="/auth/register"
                  className="btn-primary flex-1 text-center"
                  onClick={() => setMobileOpen(false)}
                >
                  Sign Up
                </Link>
              </div>
            )}
          </div>
        )}
      </nav>
    </header>
  );
}
