import React, { useEffect, useRef } from 'react';
import { ADSENSE_CLIENT_ID, ADSENSE_SLOTS, type AdPlacementId } from '../config/adsense';

declare global {
  interface Window {
    adsbygoogle?: Array<Record<string, unknown>>;
  }
}

export interface AdSlotProps {
  placement: AdPlacementId;
  routeKey?: string;
  className?: string;
}

export const AdSlot: React.FC<AdSlotProps> = ({ placement, routeKey = '', className = '' }) => {
  const config = ADSENSE_SLOTS[placement];
  const insRef = useRef<HTMLModElement>(null);

  useEffect(() => {
    const insEl = insRef.current;
    if (!insEl || typeof window === 'undefined') return;

    let pushed = false;
    let rafId = 0;
    let observer: ResizeObserver | undefined;

    const tryPushAd = () => {
      if (pushed) return;
      if (insEl.getAttribute('data-adsbygoogle-status')) {
        pushed = true;
        return;
      }
      // Never initialize an AdSense slot inside a display:none / 0-width container (e.g., lg-only sidebar on mobile)
      const width = insEl.getBoundingClientRect().width;
      if (insEl.offsetParent === null || width <= 0) {
        return;
      }
      pushed = true;
      if (observer) {
        observer.disconnect();
        observer = undefined;
      }
      try {
        window.adsbygoogle = window.adsbygoogle || [];
        window.adsbygoogle.push({});
      } catch {
        // Ignore AdSense initialization errors in offline/blocked environments
      }
    };

    rafId = window.requestAnimationFrame(() => {
      tryPushAd();
      if (!pushed && typeof ResizeObserver !== 'undefined') {
        observer = new ResizeObserver(() => {
          tryPushAd();
        });
        observer.observe(insEl);
      }
    });

    return () => {
      if (rafId) window.cancelAnimationFrame(rafId);
      if (observer) observer.disconnect();
    };
  }, [placement, routeKey]);

  const isInArticle = config.layout === 'in-article';

  return (
    <aside
      key={`${placement}-${routeKey}`}
      aria-label={config.label}
      data-ad-placement={placement}
      className={`ad-slot-shell bg-[#FAFAFA] border border-[#E5E7EB] rounded-lg px-3 py-2.5 sm:px-4 sm:py-3 ${className}`}
    >
      <p className="text-[10px] font-semibold uppercase tracking-wider text-[#9CA3AF] text-center mb-1.5 select-none">
        {config.label}
      </p>
      <div className={`w-full overflow-hidden flex items-center justify-center ${config.minHeightClass}`}>
        <ins
          ref={insRef}
          className="adsbygoogle block w-full"
          style={isInArticle ? { display: 'block', textAlign: 'center' } : { display: 'block' }}
          data-ad-client={ADSENSE_CLIENT_ID}
          data-ad-slot={config.slotId}
          data-ad-format={config.format}
          {...(config.layout ? { 'data-ad-layout': config.layout } : {})}
          {...(config.fullWidthResponsive ? { 'data-full-width-responsive': 'true' } : {})}
        />
      </div>
    </aside>
  );
};
