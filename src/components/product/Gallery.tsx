'use client';
import Image from 'next/image';
import { useState } from 'react';
import { cn } from '@/lib/utils';

export function Gallery({ images }: { images: { src: string; alt: string }[] }) {
  const [i, setI] = useState(0);
  const current = images[i];
  return (
    <div className="space-y-3">
      <div className="relative aspect-[4/3] overflow-hidden rounded-lg border bg-white">
        <Image key={current.src} src={current.src} alt={current.alt} fill priority sizes="(min-width: 1024px) 50vw, 100vw" className="object-contain" />
      </div>
      {images.length > 1 && (
        <div className="flex gap-2 overflow-x-auto">
          {images.map((img, idx) => (
            <button
              key={img.src}
              type="button"
              onClick={() => setI(idx)}
              aria-label={`Show image ${idx + 1}`}
              aria-current={idx === i}
              className={cn('relative size-16 shrink-0 overflow-hidden rounded border', idx === i && 'ring-2 ring-primary')}
            >
              <Image src={img.src} alt="" fill sizes="64px" className="object-cover" />
            </button>
          ))}
        </div>
      )}
    </div>
  );
}
