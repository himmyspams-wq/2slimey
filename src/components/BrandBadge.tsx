import { cn } from '@/lib/utils';

interface BrandBadgeProps {
  brand: string;
  className?: string;
}

export default function BrandBadge({ brand, className }: BrandBadgeProps) {
  return (
    <span className={cn('badge-brand', className)}>
      {brand}
    </span>
  );
}
