import React from 'react';
import { resolveAssetUrl } from '../utils/router';

export interface AmazonAffiliateButtonProps {
  asin: string;
  showHelperText?: boolean;
  compact?: boolean;
  align?: 'left' | 'center';
  className?: string;
}

const REMOTE_BUTTON_IMAGE = 'https://g.top4top.io/p_390434fjf1.png';

/**
 * Reusable Amazon Associates Affiliate CTA Button.
 * Renders the exact required HTML anchor & image markup sitewide where ONLY the ASIN changes.
 * If the external host (g.top4top.io) fails to load (e.g., expired SSL certificate),
 * seamlessly falls back to the identical local copy of the same 780x241 button PNG.
 */
export const AmazonAffiliateButton: React.FC<AmazonAffiliateButtonProps> = ({
  asin,
  showHelperText = true,
  compact = false,
  align = 'left',
  className = '',
}) => {
  const cleanAsin = asin.trim();
  const alignmentClass = align === 'center' ? 'items-center text-center' : 'items-start text-left';

  return (
    <div className={`flex flex-col ${alignmentClass} ${className}`}>
      {showHelperText && (
        <span className="mb-1.5 text-[12px] font-medium text-[#4B5563]">
          Check live price &amp; availability on Amazon
        </span>
      )}
      <div className={compact ? 'w-[144px] shrink-0' : 'inline-block max-w-[240px] w-full'}>
        <a
          href={`https://amazon.com/dp/${cleanAsin}?tag=liveblog36507-20`}
          className="amazon-affiliate-button"
          rel="sponsored nofollow noopener noreferrer"
          target="_blank"
        >
          <img
            src={REMOTE_BUTTON_IMAGE}
            alt="Buy On Amazon"
            width={780}
            height={241}
            loading="lazy"
            decoding="async"
            style={{ maxWidth: '240px', width: '100%', height: 'auto' }}
            onError={(event) => {
              const img = event.currentTarget;
              if (!img.dataset.localFallback) {
                img.dataset.localFallback = '1';
                img.src = resolveAssetUrl('/buy-on-amazon.png');
              }
            }}
          />
        </a>
      </div>
    </div>
  );
};
