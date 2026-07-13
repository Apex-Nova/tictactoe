'use client';

/**
 * NavIcon — thin-stroke SVG icons for navigation.
 * All icons use currentColor with a consistent 1.5px stroke.
 * Drop-shadow filter gives the "shadow style" depth effect.
 */

interface IconProps {
  size?: number;
  className?: string;
}

const style = {
  fill: 'none',
  strokeLinecap: 'round' as const,
  strokeLinejoin: 'round' as const,
  strokeWidth: 1.5,
};

export function IconPlay({ size = 22, className = '' }: IconProps) {
  return (
    <svg width={size} height={size} viewBox="0 0 24 24" className={className}
      style={{ filter: 'drop-shadow(0 1px 3px currentColor)', opacity: 0.9 }}>
      <polygon points="5,3 19,12 5,21" stroke="currentColor" {...style} />
    </svg>
  );
}

export function IconStats({ size = 22, className = '' }: IconProps) {
  return (
    <svg width={size} height={size} viewBox="0 0 24 24" className={className}
      style={{ filter: 'drop-shadow(0 1px 3px currentColor)', opacity: 0.9 }}>
      <rect x="3" y="12" width="4" height="9" rx="1" stroke="currentColor" {...style} />
      <rect x="10" y="7"  width="4" height="14" rx="1" stroke="currentColor" {...style} />
      <rect x="17" y="3"  width="4" height="18" rx="1" stroke="currentColor" {...style} />
    </svg>
  );
}

export function IconThemes({ size = 22, className = '' }: IconProps) {
  return (
    <svg width={size} height={size} viewBox="0 0 24 24" className={className}
      style={{ filter: 'drop-shadow(0 1px 3px currentColor)', opacity: 0.9 }}>
      <circle cx="12" cy="12" r="9" stroke="currentColor" {...style} />
      <circle cx="9"  cy="9"  r="1.5" fill="currentColor" />
      <circle cx="15" cy="9"  r="1.5" fill="currentColor" />
      <circle cx="9"  cy="15" r="1.5" fill="currentColor" />
      <circle cx="15" cy="15" r="1.5" fill="currentColor" />
      <circle cx="12" cy="12" r="2"   stroke="currentColor" {...style} />
    </svg>
  );
}

export function IconSettings({ size = 22, className = '' }: IconProps) {
  return (
    <svg width={size} height={size} viewBox="0 0 24 24" className={className}
      style={{ filter: 'drop-shadow(0 1px 3px currentColor)', opacity: 0.9 }}>
      <circle cx="12" cy="12" r="3" stroke="currentColor" {...style} />
      <path stroke="currentColor" {...style}
        d="M12 2v2M12 20v2M4.22 4.22l1.42 1.42M18.36 18.36l1.42 1.42
           M2 12h2M20 12h2M4.22 19.78l1.42-1.42M18.36 5.64l1.42-1.42" />
    </svg>
  );
}

export function IconHelp({ size = 22, className = '' }: IconProps) {
  return (
    <svg width={size} height={size} viewBox="0 0 24 24" className={className}
      style={{ filter: 'drop-shadow(0 1px 3px currentColor)', opacity: 0.9 }}>
      <circle cx="12" cy="12" r="9" stroke="currentColor" {...style} />
      <path stroke="currentColor" {...style}
        d="M9.5 9.5a3 3 0 0 1 5.45 1.5c0 2-3 3-3 3" />
      <circle cx="12" cy="17" r="0.5" fill="currentColor" />
    </svg>
  );
}

export function IconOnline({ size = 20, className = '' }: IconProps) {
  return (
    <svg width={size} height={size} viewBox="0 0 24 24" className={className}>
      <circle cx="12" cy="12" r="9" stroke="currentColor" {...style} />
      <path stroke="currentColor" {...style}
        d="M2 12h20M12 2a15 15 0 0 1 0 20M12 2a15 15 0 0 0 0 20" />
    </svg>
  );
}

export function IconTrophy({ size = 20, className = '' }: IconProps) {
  return (
    <svg width={size} height={size} viewBox="0 0 24 24" className={className}>
      <path stroke="currentColor" {...style}
        d="M8 21h8M12 17v4M5 3H3v5a4 4 0 0 0 4 4M19 3h2v5a4 4 0 0 1-4 4" />
      <path stroke="currentColor" {...style}
        d="M5 3h14v6a7 7 0 0 1-7 7 7 7 0 0 1-7-7V3z" />
    </svg>
  );
}

export function IconUsers({ size = 20, className = '' }: IconProps) {
  return (
    <svg width={size} height={size} viewBox="0 0 24 24" className={className}>
      <circle cx="9" cy="7" r="3" stroke="currentColor" {...style} />
      <path stroke="currentColor" {...style} d="M3 21v-2a4 4 0 0 1 4-4h4a4 4 0 0 1 4 4v2" />
      <path stroke="currentColor" {...style} d="M16 3.13a4 4 0 0 1 0 7.75M21 21v-2a4 4 0 0 0-3-3.87" />
    </svg>
  );
}

export function IconMedal({ size = 20, className = '' }: IconProps) {
  return (
    <svg width={size} height={size} viewBox="0 0 24 24" className={className}>
      <circle cx="12" cy="14" r="6" stroke="currentColor" {...style} />
      <path stroke="currentColor" {...style} d="M8.5 2.5l-2 4M15.5 2.5l2 4M8.5 2.5h7" />
      <path stroke="currentColor" {...style} d="M12 11v3l2 1" />
    </svg>
  );
}

export function IconReplay({ size = 20, className = '' }: IconProps) {
  return (
    <svg width={size} height={size} viewBox="0 0 24 24" className={className}>
      <path stroke="currentColor" {...style} d="M3 12a9 9 0 1 0 9-9 9 9 0 0 0-6.36 2.64L3 8" />
      <path stroke="currentColor" {...style} d="M3 3v5h5" />
      <polygon points="10,9 16,12 10,15" stroke="currentColor" {...style} />
    </svg>
  );
}
