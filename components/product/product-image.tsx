"use client";

import { useState, type ReactNode } from "react";

type ProductImageProps = {
  src?: string | null;
  alt: string;
  className?: string;
  imgClassName?: string;
  fallback: ReactNode;
};

export function ProductImage({ src, alt, className, imgClassName, fallback }: ProductImageProps) {
  const [failed, setFailed] = useState(false);

  if (!src || failed) {
    return <>{fallback}</>;
  }

  return (
    <div className={className}>
      {/* eslint-disable-next-line @next/next/no-img-element */}
      <img src={src} alt={alt} className={imgClassName} onError={() => setFailed(true)} />
    </div>
  );
}
