'use client';

import React, { useState, useEffect } from 'react';
import Image from 'next/image';
import { isUnoptimizedUrl } from '@/lib/drive';

interface DetailHeroBannerImageProps {
  src: string;
  alt: string;
  fallbackSrc?: string;
  district?: string;
}

export default function DetailHeroBannerImage({
  src,
  alt,
  fallbackSrc,
  district = 'Nexus Arena',
}: DetailHeroBannerImageProps) {
  const [imgSrc, setImgSrc] = useState(src);
  const [hasError, setHasError] = useState(false);

  useEffect(() => {
    setImgSrc(src);
    setHasError(false);
  }, [src]);

  return (
    <div className="relative aspect-video rounded-3xl overflow-hidden border-2 border-white shadow-md bg-[#EDF5FC] w-full">
      <Image
        src={imgSrc}
        alt={alt}
        fill
        sizes="(max-width: 1024px) 100vw, 33vw"
        className="object-cover object-center"
        priority
        unoptimized={isUnoptimizedUrl(imgSrc)}
        onError={() => {
          if (!hasError && fallbackSrc && imgSrc !== fallbackSrc) {
            setHasError(true);
            setImgSrc(fallbackSrc);
          }
        }}
      />
      <div className="absolute inset-0 bg-gradient-to-t from-[#102344]/80 via-transparent to-transparent pointer-events-none" />
      <div className="absolute bottom-3 left-3 right-3 flex items-center justify-between text-white text-[11px] font-mono pointer-events-none">
        <span className="font-bold">{district}</span>
        <span className="text-white/80">16:9 Official Artwork</span>
      </div>
    </div>
  );
}
