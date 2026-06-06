import { cn, getConditionLabel } from '@/lib/utils';

interface ConditionBadgeProps {
  condition: number;
  showNumber?: boolean;
  className?: string;
}

export default function ConditionBadge({
  condition,
  showNumber = true,
  className,
}: ConditionBadgeProps) {
  const { label, colorClass } = getConditionLabel(condition);

  return (
    <span
      className={cn(
        'badge-condition text-xs font-semibold',
        colorClass,
        className
      )}
    >
      {label}
      {showNumber && <span className="ml-1 opacity-75">({condition}/10)</span>}
    </span>
  );
}
