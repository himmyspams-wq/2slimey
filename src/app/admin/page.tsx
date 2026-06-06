'use client';

import { useState, useEffect, useCallback } from 'react';
import { useSession } from 'next-auth/react';
import { useRouter } from 'next/navigation';
import Link from 'next/link';
import {
  ShieldCheck, Flag, Fish, Loader2, CheckCircle, XCircle,
  AlertTriangle, Trash2, RefreshCw
} from 'lucide-react';
import { formatRelativeTime, formatPrice } from '@/lib/utils';
import { cn } from '@/lib/utils';

type Tab = 'listings' | 'reports' | 'users';

interface AdminListing {
  id: string;
  title: string;
  brand: string;
  price: string;
  status: string;
  createdAt: string;
  user: { name: string | null; email: string | null };
}

interface AdminReport {
  id: string;
  reason: string;
  details: string | null;
  status: string;
  createdAt: string;
  listing: { id: string; title: string; brand: string } | null;
  user: { name: string | null; email: string | null };
}

interface Stats {
  totalListings: number;
  activeListings: number;
  pendingReports: number;
  totalUsers: number;
}

const REASON_LABELS: Record<string, string> = {
  SPAM: 'Spam',
  COUNTERFEIT: 'Counterfeit',
  WRONG_BRAND: 'Wrong Brand',
  MISLEADING: 'Misleading',
  OTHER: 'Other',
};

export default function AdminPage() {
  const { data: session, status } = useSession();
  const router = useRouter();
  const [tab, setTab] = useState<Tab>('listings');
  const [listings, setListings] = useState<AdminListing[]>([]);
  const [reports, setReports] = useState<AdminReport[]>([]);
  const [stats, setStats] = useState<Stats | null>(null);
  const [loading, setLoading] = useState(true);
  const [listingFilter, setListingFilter] = useState('ALL');
  const [reportFilter, setReportFilter] = useState('PENDING');

  useEffect(() => {
    if (status === 'unauthenticated') {
      router.push('/');
      return;
    }
    if (status === 'authenticated' && !session.user.isAdmin) {
      router.push('/');
    }
  }, [status, session, router]);

  const fetchData = useCallback(async () => {
    setLoading(true);
    try {
      const [listingsRes, reportsRes] = await Promise.all([
        fetch(`/api/admin/listings?status=${listingFilter}`),
        fetch(`/api/admin/reports?status=${reportFilter}`),
      ]);

      if (listingsRes.ok) {
        const data = await listingsRes.json();
        setListings(data.listings || []);
        setStats(data.stats || null);
      }
      if (reportsRes.ok) {
        const data = await reportsRes.json();
        setReports(data.reports || []);
      }
    } catch {
      // Silently handle
    } finally {
      setLoading(false);
    }
  }, [listingFilter, reportFilter]);

  useEffect(() => {
    if (session?.user?.isAdmin) {
      fetchData();
    }
  }, [session, fetchData]);

  const updateListingStatus = async (id: string, status: string) => {
    try {
      await fetch(`/api/admin/listings`, {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ id, status }),
      });
      fetchData();
    } catch {}
  };

  const resolveReport = async (id: string, action: 'RESOLVED' | 'DISMISSED', removeListing = false) => {
    try {
      await fetch('/api/admin/reports', {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ id, status: action, removeListing }),
      });
      fetchData();
    } catch {}
  };

  if (status === 'loading' || (status === 'authenticated' && !session.user.isAdmin)) {
    return (
      <div className="flex items-center justify-center min-h-96">
        <Loader2 className="h-8 w-8 animate-spin text-navy-600" />
      </div>
    );
  }

  return (
    <div className="container-main py-8">
      {/* Header */}
      <div className="flex items-center gap-3 mb-6">
        <ShieldCheck className="h-7 w-7 text-navy-700" />
        <h1 className="font-serif text-3xl font-bold text-navy-800">Admin Panel</h1>
      </div>

      {/* Stats */}
      {stats && (
        <div className="grid grid-cols-2 md:grid-cols-4 gap-4 mb-8">
          {[
            { label: 'Total Listings', value: stats.totalListings, icon: Fish, color: 'text-navy-700' },
            { label: 'Active Listings', value: stats.activeListings, icon: CheckCircle, color: 'text-green-600' },
            { label: 'Pending Reports', value: stats.pendingReports, icon: Flag, color: 'text-red-600' },
            { label: 'Total Users', value: stats.totalUsers, icon: ShieldCheck, color: 'text-blue-600' },
          ].map((stat) => (
            <div key={stat.label} className="card p-5">
              <div className="flex items-center gap-2 mb-1">
                <stat.icon className={cn('h-5 w-5', stat.color)} />
                <span className="text-xs text-navy-500 font-medium">{stat.label}</span>
              </div>
              <p className="text-2xl font-bold text-navy-800">{stat.value}</p>
            </div>
          ))}
        </div>
      )}

      {/* Tabs */}
      <div className="flex gap-1 border-b border-cream-300 mb-6">
        {(['listings', 'reports'] as Tab[]).map((t) => (
          <button
            key={t}
            onClick={() => setTab(t)}
            className={cn(
              'px-6 py-3 text-sm font-medium capitalize transition-all border-b-2 -mb-px',
              tab === t
                ? 'border-navy-700 text-navy-800'
                : 'border-transparent text-navy-500 hover:text-navy-700'
            )}
          >
            {t}
            {t === 'reports' && stats && stats.pendingReports > 0 && (
              <span className="ml-2 bg-red-600 text-white text-xs px-1.5 py-0.5 rounded-full">
                {stats.pendingReports}
              </span>
            )}
          </button>
        ))}
        <button
          onClick={fetchData}
          className="ml-auto p-2 text-navy-400 hover:text-navy-700 transition-colors"
          title="Refresh"
        >
          <RefreshCw className="h-4 w-4" />
        </button>
      </div>

      {loading ? (
        <div className="flex items-center justify-center py-12">
          <Loader2 className="h-8 w-8 animate-spin text-navy-600" />
        </div>
      ) : (
        <>
          {/* Listings Tab */}
          {tab === 'listings' && (
            <div>
              <div className="flex items-center gap-3 mb-4">
                <label className="text-sm font-medium text-navy-700">Status:</label>
                <select
                  value={listingFilter}
                  onChange={(e) => setListingFilter(e.target.value)}
                  className="input-base w-40"
                >
                  <option value="ALL">All</option>
                  <option value="ACTIVE">Active</option>
                  <option value="SOLD">Sold</option>
                  <option value="REMOVED">Removed</option>
                  <option value="DRAFT">Draft</option>
                </select>
              </div>

              <div className="card overflow-hidden">
                <table className="w-full text-sm">
                  <thead className="bg-cream-100 border-b border-cream-300">
                    <tr>
                      <th className="text-left py-3 px-4 font-semibold text-navy-600">Title</th>
                      <th className="text-left py-3 px-4 font-semibold text-navy-600">Brand</th>
                      <th className="text-left py-3 px-4 font-semibold text-navy-600">Price</th>
                      <th className="text-left py-3 px-4 font-semibold text-navy-600">Seller</th>
                      <th className="text-left py-3 px-4 font-semibold text-navy-600">Status</th>
                      <th className="text-left py-3 px-4 font-semibold text-navy-600">Listed</th>
                      <th className="py-3 px-4 font-semibold text-navy-600">Actions</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-cream-200">
                    {listings.map((listing) => (
                      <tr key={listing.id} className="hover:bg-cream-50 transition-colors">
                        <td className="py-3 px-4">
                          <Link
                            href={`/listings/${listing.id}`}
                            className="text-navy-700 hover:text-navy-900 font-medium line-clamp-1 max-w-xs block"
                          >
                            {listing.title}
                          </Link>
                        </td>
                        <td className="py-3 px-4 text-navy-600">{listing.brand}</td>
                        <td className="py-3 px-4 text-navy-600">{formatPrice(parseFloat(listing.price))}</td>
                        <td className="py-3 px-4 text-navy-500 text-xs">
                          {listing.user.name || listing.user.email}
                        </td>
                        <td className="py-3 px-4">
                          <span className={cn('text-xs px-2 py-1 rounded-full font-medium', {
                            'bg-green-100 text-green-700': listing.status === 'ACTIVE',
                            'bg-red-100 text-red-700': listing.status === 'SOLD' || listing.status === 'REMOVED',
                            'bg-gray-100 text-gray-600': listing.status === 'DRAFT',
                          })}>
                            {listing.status}
                          </span>
                        </td>
                        <td className="py-3 px-4 text-navy-400 text-xs">
                          {formatRelativeTime(listing.createdAt)}
                        </td>
                        <td className="py-3 px-4">
                          {listing.status !== 'REMOVED' && (
                            <button
                              onClick={() => updateListingStatus(listing.id, 'REMOVED')}
                              className="p-1.5 text-red-500 hover:bg-red-50 rounded transition-colors"
                              title="Remove listing"
                            >
                              <Trash2 className="h-4 w-4" />
                            </button>
                          )}
                          {listing.status === 'REMOVED' && (
                            <button
                              onClick={() => updateListingStatus(listing.id, 'ACTIVE')}
                              className="p-1.5 text-green-600 hover:bg-green-50 rounded transition-colors"
                              title="Restore listing"
                            >
                              <CheckCircle className="h-4 w-4" />
                            </button>
                          )}
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
                {listings.length === 0 && (
                  <p className="text-center text-navy-400 py-8">No listings found.</p>
                )}
              </div>
            </div>
          )}

          {/* Reports Tab */}
          {tab === 'reports' && (
            <div>
              <div className="flex items-center gap-3 mb-4">
                <label className="text-sm font-medium text-navy-700">Status:</label>
                <select
                  value={reportFilter}
                  onChange={(e) => setReportFilter(e.target.value)}
                  className="input-base w-40"
                >
                  <option value="PENDING">Pending</option>
                  <option value="RESOLVED">Resolved</option>
                  <option value="DISMISSED">Dismissed</option>
                </select>
              </div>

              <div className="space-y-4">
                {reports.map((report) => (
                  <div key={report.id} className="card p-5">
                    <div className="flex items-start justify-between gap-4">
                      <div className="flex-1">
                        <div className="flex items-center gap-2 mb-2">
                          <Flag className="h-4 w-4 text-red-500" />
                          <span className="font-semibold text-navy-800 text-sm">
                            {REASON_LABELS[report.reason] || report.reason}
                          </span>
                          <span className={cn('text-xs px-2 py-0.5 rounded-full font-medium', {
                            'bg-amber-100 text-amber-700': report.status === 'PENDING',
                            'bg-green-100 text-green-700': report.status === 'RESOLVED',
                            'bg-gray-100 text-gray-600': report.status === 'DISMISSED',
                          })}>
                            {report.status}
                          </span>
                        </div>

                        {report.listing && (
                          <div className="flex items-center gap-2 mb-2">
                            <span className="text-xs text-navy-400">Listing:</span>
                            <Link
                              href={`/listings/${report.listing.id}`}
                              className="text-xs text-navy-600 hover:text-navy-800 font-medium underline"
                            >
                              {report.listing.title} ({report.listing.brand})
                            </Link>
                          </div>
                        )}

                        {report.details && (
                          <p className="text-sm text-navy-600 bg-cream-50 rounded-lg p-3 border border-cream-200">
                            &ldquo;{report.details}&rdquo;
                          </p>
                        )}

                        <div className="mt-2 text-xs text-navy-400">
                          Reported by {report.user.name || report.user.email} &bull;{' '}
                          {formatRelativeTime(report.createdAt)}
                        </div>
                      </div>

                      {report.status === 'PENDING' && (
                        <div className="flex flex-col gap-2 flex-shrink-0">
                          <button
                            onClick={() => resolveReport(report.id, 'RESOLVED')}
                            className="flex items-center gap-1 px-3 py-1.5 text-xs font-medium bg-green-600 text-white rounded-lg hover:bg-green-700 transition-colors"
                          >
                            <CheckCircle className="h-3 w-3" />
                            Resolve
                          </button>
                          {report.listing && (
                            <button
                              onClick={() => resolveReport(report.id, 'RESOLVED', true)}
                              className="flex items-center gap-1 px-3 py-1.5 text-xs font-medium bg-red-600 text-white rounded-lg hover:bg-red-700 transition-colors"
                            >
                              <Trash2 className="h-3 w-3" />
                              Remove Listing
                            </button>
                          )}
                          <button
                            onClick={() => resolveReport(report.id, 'DISMISSED')}
                            className="flex items-center gap-1 px-3 py-1.5 text-xs font-medium border border-navy-300 text-navy-600 rounded-lg hover:bg-cream-100 transition-colors"
                          >
                            <XCircle className="h-3 w-3" />
                            Dismiss
                          </button>
                        </div>
                      )}
                    </div>
                  </div>
                ))}
                {reports.length === 0 && (
                  <div className="card p-10 text-center">
                    <AlertTriangle className="h-8 w-8 text-navy-300 mx-auto mb-3" />
                    <p className="text-navy-400">No {reportFilter.toLowerCase()} reports.</p>
                  </div>
                )}
              </div>
            </div>
          )}
        </>
      )}
    </div>
  );
}
