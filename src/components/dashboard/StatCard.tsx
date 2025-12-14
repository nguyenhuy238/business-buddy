import { cn } from '@/lib/utils';
import { LucideIcon } from 'lucide-react';
import { formatCurrency, formatNumber } from '@/lib/format';

interface StatCardProps {
  title: string;
  value: number;
  subtitle?: string;
  icon: LucideIcon;
  trend?: {
    value: number;
    isPositive: boolean;
  };
  variant?: 'default' | 'primary' | 'accent' | 'success' | 'warning';
  isCurrency?: boolean;
}

const variantStyles = {
  default: 'bg-card',
  primary: 'bg-primary text-primary-foreground',
  accent: 'bg-accent text-accent-foreground',
  success: 'bg-success text-success-foreground',
  warning: 'bg-warning text-warning-foreground',
};

const iconBgStyles = {
  default: 'bg-primary/10 text-primary',
  primary: 'bg-primary-foreground/20 text-primary-foreground',
  accent: 'bg-accent-foreground/20 text-accent-foreground',
  success: 'bg-success-foreground/20 text-success-foreground',
  warning: 'bg-warning-foreground/20 text-warning-foreground',
};

export function StatCard({
  title,
  value,
  subtitle,
  icon: Icon,
  trend,
  variant = 'default',
  isCurrency = false,
}: StatCardProps) {
  const displayValue = isCurrency ? formatCurrency(value) : formatNumber(value);

  return (
    <div
      className={cn(
        'rounded-xl border p-5 shadow-sm card-hover animate-fade-in',
        variantStyles[variant]
      )}
    >
      <div className="flex items-start justify-between">
        <div className="flex-1">
          <p
            className={cn(
              'text-sm font-medium',
              variant === 'default' ? 'text-muted-foreground' : 'opacity-90'
            )}
          >
            {title}
          </p>
          <p className="mt-2 text-2xl font-bold tracking-tight">{displayValue}</p>
          {subtitle && (
            <p
              className={cn(
                'mt-1 text-xs',
                variant === 'default' ? 'text-muted-foreground' : 'opacity-75'
              )}
            >
              {subtitle}
            </p>
          )}
          {trend && (
            <div className="mt-2 flex items-center gap-1 text-xs">
              <span
                className={cn(
                  'font-medium',
                  trend.isPositive ? 'text-success' : 'text-destructive',
                  variant !== 'default' && 'opacity-90'
                )}
              >
                {trend.isPositive ? '+' : ''}
                {trend.value}%
              </span>
              <span className={variant === 'default' ? 'text-muted-foreground' : 'opacity-75'}>
                so với hôm qua
              </span>
            </div>
          )}
        </div>
        <div className={cn('rounded-lg p-2.5', iconBgStyles[variant])}>
          <Icon className="h-5 w-5" />
        </div>
      </div>
    </div>
  );
}
