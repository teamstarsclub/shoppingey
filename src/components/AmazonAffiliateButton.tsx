import React, { useState } from 'react';

export interface AmazonAffiliateButtonProps {
  asin: string;
  showHelperText?: boolean;
  compact?: boolean;
  align?: 'left' | 'center';
  className?: string;
}

/**
 * Reusable Amazon Associates Affiliate CTA Button.
 * Preserves the exact required HTML anchor & image markup sitewide, with a
 * CSS-only fallback treatment on the outer wrapper if the remote image host is unreachable.
 */
export const AmazonAffiliateButton: React.FC<AmazonAffiliateButtonProps> = ({
  asin,
  showHelperText = true,
  compact = false,
  align = 'left',
  className = '',
}) => {
  const [imgFailed, setImgFailed] = useState(false);
  const alignmentClass = align === 'center' ? 'items-center text-center' : 'items-start text-left';

  return (
    <div className={`flex flex-col ${alignmentClass} ${className}`}>
      {showHelperText && (
        <span className="mb-1.5 text-[12px] font-medium text-[#4B5563]">
          Check live price &amp; availability on Amazon
        </span>
      )}
      <div
        className={`${compact ? 'w-[152px] shrink-0' : 'w-full max-w-[240px]'} ${
          imgFailed ? 'amazon-btn-fallback' : ''
        }`}
        onErrorCapture={() => setImgFailed(true)}
      >
        <a
          href={`https://amazon.com/dp/${asin}?tag=liveblog36507-20`}
          className="amazon-affiliate-button"
          rel="sponsored nofollow noopener noreferrer"
          target="_blank"
        >
          <img
            src="https://g.top4top.io/p_390434fjf1.png"
            alt="Buy On Amazon"
            width={780}
            height={241}
            loading="lazy"
            decoding="async"
            style={{ maxWidth: '240px', width: '100%', height: 'auto' }}
          />
        </a>
      </div>
    </div>
  );
};
