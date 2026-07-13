'use client';

import { QRCodeSVG } from 'qrcode.react';

interface Props {
  value: string;
  label?: string;
  size?: number;
}

export function QRCodeDisplay({ value, label, size = 220 }: Props) {
  return (
    <div className="flex flex-col items-center gap-2">
      <div className="p-3 bg-white rounded-2xl shadow-lg">
        <QRCodeSVG
          value={value}
          size={size}
          level="M"
          bgColor="#ffffff"
          fgColor="#1a1a1a"
        />
      </div>
      {label && (
        <p className="text-xs text-[var(--color-text-muted)] text-center max-w-[240px]">{label}</p>
      )}
    </div>
  );
}
