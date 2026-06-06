import { clsx, type ClassValue } from 'clsx';
import { twMerge } from 'tailwind-merge';
import { formatDistanceToNow } from 'date-fns';

export function cn(...inputs: ClassValue[]) {
  return twMerge(clsx(inputs));
}

export function formatPrice(price: number | string): string {
  const num = typeof price === 'string' ? parseFloat(price) : price;
  return new Intl.NumberFormat('en-US', {
    style: 'currency',
    currency: 'USD',
    minimumFractionDigits: 0,
    maximumFractionDigits: 0,
  }).format(num);
}

export function formatRelativeTime(date: Date | string): string {
  const d = typeof date === 'string' ? new Date(date) : date;
  return formatDistanceToNow(d, { addSuffix: true });
}

export interface ConditionInfo {
  label: string;
  colorClass: string;
}

export function getConditionLabel(condition: number): ConditionInfo {
  if (condition >= 9) {
    return { label: 'Mint', colorClass: 'text-green-700 bg-green-100' };
  } else if (condition >= 7) {
    return { label: 'Excellent', colorClass: 'text-emerald-700 bg-emerald-100' };
  } else if (condition >= 5) {
    return { label: 'Good', colorClass: 'text-blue-700 bg-blue-100' };
  } else if (condition >= 3) {
    return { label: 'Fair', colorClass: 'text-amber-700 bg-amber-100' };
  } else {
    return { label: 'Poor', colorClass: 'text-red-700 bg-red-100' };
  }
}

export function slugify(text: string): string {
  return text
    .toLowerCase()
    .replace(/[^a-z0-9\s-]/g, '')
    .replace(/\s+/g, '-')
    .replace(/-+/g, '-')
    .trim();
}

export function getInitials(name: string): string {
  return name
    .split(' ')
    .map((word) => word[0])
    .join('')
    .toUpperCase()
    .slice(0, 2);
}
