'use client';

interface Props {
  formatted: string;
  className?: string;
}

export function MatchTimer({ formatted, className = '' }: Props) {
  return (
    <span
      className={`font-mono text-sm font-bold tabular-nums ${className}`}
      style={{ color: 'var(--th-text-muted)' }}
      aria-label={`Match time: ${formatted}`}
    >
      {formatted}
    </span>
  );
}
