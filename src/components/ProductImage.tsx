import React, { useState } from 'react';
import { Package } from 'lucide-react';
import { resolveAssetUrl } from '../utils/router';

export interface ProductImageProps {
  src: string;
  alt: string;
  priority?: boolean;
  zoomed?: boolean;
  zoomOrigin?: string;
  className?: string;
  containerClassName?: string;
}

/**
 * CLS-safe 4:3 product image container with explicit dimensions,
 * eager/high-priority LCP mode for review heroes, and styled fallback.
 */
export const ProductImage: React.FC<ProductImageProps> = ({
  src,
  alt,
  priority = false,
  zoomed = false,
  zoomOrigin = '50% 50%',
  className = '',
  containerClassName = '',
}) => {
  const [hasError, setHasError] = useState(false);

  return (
    <div
      className={`relative w-full aspect-[4/3] overflow-hidden bg-[#F8F9FA] flex items-center justify-center ${containerClassName}`}
    >
      {hasError ? (
        <div className="flex flex-col items-center justify-center gap-2 p-6 text-center text-[#4B5563] bg-[#F9FAFB] w-full h-full">
          <Package className="w-8 h-8 text-[#9CA3AF]" aria-hidden="true" />
          <span className="text-xs font-medium max-w-[200px] leading-snug">{alt}</span>
        </div>
      ) : (
        <img
          src={resolveAssetUrl(src)}
          alt={alt}
          width={800}
          height={600}
          loading={priority ? 'eager' : 'lazy'}
          decoding={priority ? 'sync' : 'async'}
          fetchPriority={priority ? 'high' : 'auto'}
          referrerPolicy="no-referrer"
          onError={() => setHasError(true)}
          style={
            zoomed
              ? {
                  transform: 'scale(1.85)',
                  transformOrigin: zoomOrigin,
                }
              : undefined
          }
          className={`w-full h-full object-contain p-3 mix-blend-multiply transition-transform duration-300 ease-out ${className}`}
        />
      )}
    </div>
  );
};
