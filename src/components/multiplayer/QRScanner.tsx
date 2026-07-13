'use client';

import { useEffect, useRef, useState } from 'react';
import jsQR from 'jsqr';

interface Props {
  onScan: (data: string) => void;
  onError?: (msg: string) => void;
}

export function QRScanner({ onScan, onError }: Props) {
  const videoRef  = useRef<HTMLVideoElement>(null);
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const rafRef    = useRef<number>(0);
  const [cameraError, setCameraError] = useState<string | null>(null);
  const [scanning, setScanning] = useState(false);

  useEffect(() => {
    let stream: MediaStream | null = null;

    async function start() {
      try {
        stream = await navigator.mediaDevices.getUserMedia({
          video: { facingMode: 'environment' },
        });
        if (!videoRef.current) return;
        videoRef.current.srcObject = stream;
        await videoRef.current.play();
        setScanning(true);
        tick();
      } catch (e) {
        const msg = 'Camera access denied. Enter the code manually instead.';
        setCameraError(msg);
        onError?.(msg);
      }
    }

    function tick() {
      const video  = videoRef.current;
      const canvas = canvasRef.current;
      if (!video || !canvas || video.readyState < 2) {
        rafRef.current = requestAnimationFrame(tick);
        return;
      }
      const ctx = canvas.getContext('2d');
      if (!ctx) return;
      canvas.width  = video.videoWidth;
      canvas.height = video.videoHeight;
      ctx.drawImage(video, 0, 0);
      const img = ctx.getImageData(0, 0, canvas.width, canvas.height);
      const code = jsQR(img.data, img.width, img.height, { inversionAttempts: 'dontInvert' });
      if (code?.data) {
        onScan(code.data);
        return; // stop scanning after first result
      }
      rafRef.current = requestAnimationFrame(tick);
    }

    start();
    return () => {
      cancelAnimationFrame(rafRef.current);
      stream?.getTracks().forEach(t => t.stop());
    };
  }, [onScan, onError]);

  if (cameraError) {
    return (
      <div className="text-[var(--color-text-muted)] text-sm text-center p-4 rounded-xl
        border border-[var(--color-surface-3)] bg-[var(--color-surface-1)]">
        {cameraError}
      </div>
    );
  }

  return (
    <div className="relative rounded-2xl overflow-hidden bg-black" style={{ width: 260, height: 260 }}>
      <video
        ref={videoRef}
        className="absolute inset-0 w-full h-full object-cover"
        muted
        playsInline
      />
      <canvas ref={canvasRef} className="hidden" />
      {/* Scanning frame overlay */}
      <div className="absolute inset-4 border-2 border-[var(--color-accent)] rounded-xl opacity-70 pointer-events-none" />
      {scanning && (
        <div className="absolute bottom-3 left-0 right-0 text-center text-xs text-white/70">
          Point at the QR code
        </div>
      )}
    </div>
  );
}
