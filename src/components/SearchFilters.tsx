'use client';

import { useRouter, useSearchParams } from 'next/navigation';
import { useCallback } from 'react';
import { X } from 'lucide-react';
import { BRAND_CATEGORIES } from '@/lib/brands';
import { cn } from '@/lib/utils';

const CONDITION_GROUPS = [
  { label: 'Mint (9-10)', min: 9, max: 10 },
  { label: 'Excellent (7-8)', min: 7, max: 8 },
  { label: 'Good (5-6)', min: 5, max: 6 },
  { label: 'Fair (3-4)', min: 3, max: 4 },
  { label: 'Poor (1-2)', min: 1, max: 2 },
];

const SORT_OPTIONS = [
  { value: 'newest', label: 'Newest First' },
  { value: 'price_asc', label: 'Price: Low to High' },
  { value: 'price_desc', label: 'Price: High to Low' },
];

export default function SearchFilters() {
  const router = useRouter();
  const searchParams = useSearchParams();

  const getParam = (key: string) => searchParams.get(key) || '';
  const getParamArray = (key: string) =>
    searchParams.getAll(key);

  const updateParam = useCallback(
    (updates: Record<string, string | string[] | null>) => {
      const params = new URLSearchParams(searchParams.toString());
      params.delete('page'); // reset page on filter change

      for (const [key, value] of Object.entries(updates)) {
        params.delete(key);
        if (value === null) continue;
        if (Array.isArray(value)) {
          value.forEach((v) => params.append(key, v));
        } else if (value) {
          params.set(key, value);
        }
      }

      router.push(`/listings?${params.toString()}`);
    },
    [router, searchParams]
  );

  const toggleBrand = (brand: string) => {
    const current = getParamArray('brand');
    const updated = current.includes(brand)
      ? current.filter((b) => b !== brand)
      : [...current, brand];
    updateParam({ brand: updated });
  };

  const toggleCondition = (min: number, max: number) => {
    const key = `${min}-${max}`;
    const current = getParamArray('condition');
    const updated = current.includes(key)
      ? current.filter((c) => c !== key)
      : [...current, key];
    updateParam({ condition: updated });
  };

  const selectedBrands = getParamArray('brand');
  const selectedConditions = getParamArray('condition');
  const sort = getParam('sort') || 'newest';
  const minPrice = getParam('minPrice');
  const maxPrice = getParam('maxPrice');

  const hasActiveFilters =
    selectedBrands.length > 0 ||
    selectedConditions.length > 0 ||
    minPrice ||
    maxPrice ||
    sort !== 'newest';

  const clearAll = () => {
    router.push('/listings');
  };

  return (
    <div className="space-y-6">
      {/* Clear All */}
      {hasActiveFilters && (
        <button
          onClick={clearAll}
          className="flex items-center gap-1.5 text-sm text-red-600 hover:text-red-700 font-medium"
        >
          <X className="h-4 w-4" />
          Clear All Filters
        </button>
      )}

      {/* Sort */}
      <div>
        <h3 className="text-sm font-semibold text-navy-700 uppercase tracking-wider mb-3">Sort By</h3>
        <select
          value={sort}
          onChange={(e) => updateParam({ sort: e.target.value })}
          className="input-base"
        >
          {SORT_OPTIONS.map((opt) => (
            <option key={opt.value} value={opt.value}>{opt.label}</option>
          ))}
        </select>
      </div>

      {/* Price Range */}
      <div>
        <h3 className="text-sm font-semibold text-navy-700 uppercase tracking-wider mb-3">Price Range</h3>
        <div className="flex gap-2 items-center">
          <div className="relative flex-1">
            <span className="absolute left-3 top-1/2 -translate-y-1/2 text-navy-400 text-sm">$</span>
            <input
              type="number"
              placeholder="Min"
              value={minPrice}
              onChange={(e) => updateParam({ minPrice: e.target.value || null })}
              className="input-base pl-7"
              min={0}
            />
          </div>
          <span className="text-navy-400 text-sm">to</span>
          <div className="relative flex-1">
            <span className="absolute left-3 top-1/2 -translate-y-1/2 text-navy-400 text-sm">$</span>
            <input
              type="number"
              placeholder="Max"
              value={maxPrice}
              onChange={(e) => updateParam({ maxPrice: e.target.value || null })}
              className="input-base pl-7"
              min={0}
            />
          </div>
        </div>
      </div>

      {/* Brands */}
      <div>
        <h3 className="text-sm font-semibold text-navy-700 uppercase tracking-wider mb-3">Brand</h3>

        <div className="space-y-4">
          <div>
            <p className="text-xs font-medium text-navy-500 mb-2 uppercase tracking-wide">Conventional</p>
            <div className="space-y-1.5">
              {BRAND_CATEGORIES.conventional.map((brand) => (
                <label key={brand} className="flex items-center gap-2 cursor-pointer group">
                  <input
                    type="checkbox"
                    checked={selectedBrands.includes(brand)}
                    onChange={() => toggleBrand(brand)}
                    className="w-4 h-4 rounded border-navy-300 text-navy-700 focus:ring-navy-500"
                  />
                  <span className={cn(
                    'text-sm transition-colors',
                    selectedBrands.includes(brand) ? 'text-navy-800 font-medium' : 'text-navy-600 group-hover:text-navy-800'
                  )}>
                    {brand}
                  </span>
                </label>
              ))}
            </div>
          </div>

          <div>
            <p className="text-xs font-medium text-navy-500 mb-2 uppercase tracking-wide">Fly Fishing</p>
            <div className="space-y-1.5">
              {BRAND_CATEGORIES.fly.map((brand) => (
                <label key={brand} className="flex items-center gap-2 cursor-pointer group">
                  <input
                    type="checkbox"
                    checked={selectedBrands.includes(brand)}
                    onChange={() => toggleBrand(brand)}
                    className="w-4 h-4 rounded border-navy-300 text-navy-700 focus:ring-navy-500"
                  />
                  <span className={cn(
                    'text-sm transition-colors',
                    selectedBrands.includes(brand) ? 'text-navy-800 font-medium' : 'text-navy-600 group-hover:text-navy-800'
                  )}>
                    {brand}
                  </span>
                </label>
              ))}
            </div>
          </div>
        </div>
      </div>

      {/* Condition */}
      <div>
        <h3 className="text-sm font-semibold text-navy-700 uppercase tracking-wider mb-3">Condition</h3>
        <div className="space-y-1.5">
          {CONDITION_GROUPS.map((group) => {
            const key = `${group.min}-${group.max}`;
            const checked = selectedConditions.includes(key);
            return (
              <label key={key} className="flex items-center gap-2 cursor-pointer group">
                <input
                  type="checkbox"
                  checked={checked}
                  onChange={() => toggleCondition(group.min, group.max)}
                  className="w-4 h-4 rounded border-navy-300 text-navy-700 focus:ring-navy-500"
                />
                <span className={cn(
                  'text-sm transition-colors',
                  checked ? 'text-navy-800 font-medium' : 'text-navy-600 group-hover:text-navy-800'
                )}>
                  {group.label}
                </span>
              </label>
            );
          })}
        </div>
      </div>
    </div>
  );
}
