export const ADSENSE_CLIENT_ID = 'ca-pub-5379808297296166' as const;

export type AdPlacementId =
  | 'homeLeaderboard'
  | 'homeMidBanner'
  | 'categoryTopBanner'
  | 'categoryInFeed'
  | 'reviewPostHero'
  | 'reviewSidebarSticky'
  | 'reviewInArticle'
  | 'reviewPostVerdict';

export interface AdSlotConfig {
  slotId: string;
  format: 'auto' | 'fluid' | 'rectangle' | 'horizontal' | 'autorelaxed';
  layout?: 'in-article';
  fullWidthResponsive: boolean;
  minHeightClass: string;
  label: string;
}

/**
 * Evidence-based high-CTR & high-viewability Google AdSense placement registry.
 * Replace individual 10-digit `slotId` strings with exact unit IDs created in your
 * Google AdSense dashboard at any time without touching page components.
 */
export const ADSENSE_SLOTS: Record<AdPlacementId, AdSlotConfig> = {
  homeLeaderboard: {
    slotId: '5379801001',
    format: 'horizontal',
    fullWidthResponsive: true,
    minHeightClass: 'min-h-[96px] sm:min-h-[104px]',
    label: 'Advertisement',
  },
  homeMidBanner: {
    slotId: '5379801002',
    format: 'auto',
    fullWidthResponsive: true,
    minHeightClass: 'min-h-[110px] sm:min-h-[250px]',
    label: 'Advertisement',
  },
  categoryTopBanner: {
    slotId: '5379802001',
    format: 'horizontal',
    fullWidthResponsive: true,
    minHeightClass: 'min-h-[96px] sm:min-h-[104px]',
    label: 'Advertisement',
  },
  categoryInFeed: {
    slotId: '5379802002',
    format: 'fluid',
    layout: 'in-article',
    fullWidthResponsive: true,
    minHeightClass: 'min-h-[180px] sm:min-h-[220px]',
    label: 'Sponsored Recommendation',
  },
  reviewPostHero: {
    slotId: '5379803001',
    format: 'horizontal',
    fullWidthResponsive: true,
    minHeightClass: 'min-h-[96px] sm:min-h-[104px]',
    label: 'Advertisement',
  },
  reviewSidebarSticky: {
    slotId: '5379803002',
    format: 'rectangle',
    fullWidthResponsive: false,
    minHeightClass: 'min-h-[250px]',
    label: 'Advertisement',
  },
  reviewInArticle: {
    slotId: '5379803003',
    format: 'fluid',
    layout: 'in-article',
    fullWidthResponsive: true,
    minHeightClass: 'min-h-[220px] sm:min-h-[260px]',
    label: 'Advertisement',
  },
  reviewPostVerdict: {
    slotId: '5379803004',
    format: 'autorelaxed',
    fullWidthResponsive: true,
    minHeightClass: 'min-h-[180px] sm:min-h-[240px]',
    label: 'Sponsored Picks',
  },
};
