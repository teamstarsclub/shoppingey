import React, { useState, useRef, useEffect } from 'react';
import { Search, ShieldCheck, X, ArrowRight } from 'lucide-react';
import { CATEGORIES, REVIEWS, type CategorySlug } from '../data/reviews';
import { getCategoryBySlug, searchReviews } from '../utils/catalog';
import { navigateTo, resolveAssetUrl } from '../utils/router';
import { Link } from './Link';
import { StarRating } from './StarRating';

export interface HeaderProps {
  activePath: string;
}

export const Header: React.FC<HeaderProps> = ({ activePath }) => {
  const [selectedCategory, setSelectedCategory] = useState<CategorySlug | 'all'>('all');
  const [query, setQuery] = useState('');
  const [isDropdownOpen, setIsDropdownOpen] = useState(false);
  const searchContainerRef = useRef<HTMLDivElement>(null);

  const trimmedQuery = query.trim();
  const instantResults =
    trimmedQuery.length > 0 || selectedCategory !== 'all'
      ? searchReviews(REVIEWS, query, selectedCategory)
      : REVIEWS;

  useEffect(() => {
    const handleOutsideClick = (event: MouseEvent) => {
      if (
        searchContainerRef.current &&
        !searchContainerRef.current.contains(event.target as Node)
      ) {
        setIsDropdownOpen(false);
      }
    };
    const handleKeyDown = (event: KeyboardEvent) => {
      if (event.key === 'Escape') {
        setIsDropdownOpen(false);
      }
    };
    document.addEventListener('mousedown', handleOutsideClick);
    document.addEventListener('keydown', handleKeyDown);
    return () => {
      document.removeEventListener('mousedown', handleOutsideClick);
      document.removeEventListener('keydown', handleKeyDown);
    };
  }, []);

  const handleSubmit = (event: React.FormEvent) => {
    event.preventDefault();
    if (trimmedQuery && instantResults.length === 1) {
      setIsDropdownOpen(false);
      navigateTo(`/review/${instantResults[0].slug}`);
      return;
    }
    if (!trimmedQuery && selectedCategory !== 'all') {
      setIsDropdownOpen(false);
      navigateTo(`/category/${selectedCategory}`);
      return;
    }
    setIsDropdownOpen(true);
  };

  const handleSelectResult = (slug: string) => {
    setIsDropdownOpen(false);
    setQuery('');
    navigateTo(`/review/${slug}`);
  };

  return (
    <>
      <header className="sticky top-0 z-40 shadow-sm">
        {/* Top Storefront Bar (#131921) */}
        <div className="bg-[#131921] text-white">
          <div className="max-w-[1360px] mx-auto px-4 sm:px-6 py-2.5 flex flex-wrap md:flex-nowrap items-center justify-between gap-3 md:gap-6">
            {/* Brand Wordmark */}
            <Link
              to="/"
              className="flex items-center gap-2 shrink-0 whitespace-nowrap group"
              aria-label="Shoppingey.com Home"
            >
              <span className="inline-flex items-center justify-center w-8 h-8 rounded-md bg-[#F59E0B] text-[#131921] font-extrabold text-base tracking-tight">
                S
              </span>
              <span className="text-[19px] font-bold tracking-tight text-white">
                Shoppingey<span className="text-[#F59E0B]">.com</span>
              </span>
            </Link>

            {/* Amazon-Style Search Bar with Category Dropdown & Live Instant Results */}
            <div
              ref={searchContainerRef}
              className="relative order-3 md:order-2 w-full md:flex-1 md:max-w-[640px]"
            >
              <form
                onSubmit={handleSubmit}
                role="search"
                aria-label="Search Shoppingey product reviews"
                className="flex items-stretch h-10 rounded-md overflow-hidden bg-white ring-2 ring-transparent focus-within:ring-[#F59E0B] transition-shadow"
              >
                <label htmlFor="header-category-select" className="sr-only">
                  Filter search by department
                </label>
                <select
                  id="header-category-select"
                  value={selectedCategory}
                  onChange={(e) => {
                    setSelectedCategory(e.target.value as CategorySlug | 'all');
                    setIsDropdownOpen(true);
                  }}
                  className="bg-[#F3F4F6] text-[#111827] text-xs sm:text-[13px] font-medium px-2.5 sm:px-3 border-r border-[#E5E7EB] max-w-[125px] sm:max-w-[160px] truncate cursor-pointer hover:bg-[#E5E7EB] transition-colors focus:outline-none"
                >
                  <option value="all">All Categories</option>
                  {CATEGORIES.map((cat) => (
                    <option key={cat.slug} value={cat.slug}>
                      {cat.name}
                    </option>
                  ))}
                </select>

                <label htmlFor="header-search-input" className="sr-only">
                  Search product reviews
                </label>
                <input
                  id="header-search-input"
                  type="search"
                  value={query}
                  onFocus={() => setIsDropdownOpen(true)}
                  onChange={(e) => {
                    setQuery(e.target.value);
                    setIsDropdownOpen(true);
                  }}
                  placeholder="Search tested Amazon products (e.g. air fryer, drill, doorbell)..."
                  autoComplete="off"
                  className="flex-1 min-w-0 px-3 text-sm text-[#111827] placeholder:text-[#6B7280] focus:outline-none"
                />

                {query && (
                  <button
                    type="button"
                    onClick={() => setQuery('')}
                    aria-label="Clear search query"
                    className="px-2 text-[#6B7280] hover:text-[#111827] transition-colors"
                  >
                    <X className="w-4 h-4" />
                  </button>
                )}

                <button
                  type="submit"
                  aria-label="Submit search"
                  className="px-3.5 bg-[#F59E0B] hover:bg-[#D97706] text-[#131921] font-semibold flex items-center justify-center transition-colors shrink-0 cursor-pointer"
                >
                  <Search className="w-4 h-4 stroke-[2.4]" />
                </button>
              </form>

              {/* Live Instant Search Dropdown */}
              {isDropdownOpen && (
                <div
                  role="region"
                  aria-label="Instant review search results"
                  className="absolute left-0 right-0 top-[calc(100%+6px)] bg-white text-[#111827] rounded-lg border border-[#E5E7EB] shadow-xl overflow-hidden z-50"
                >
                  <div className="px-3.5 py-2 bg-[#F9FAFB] border-b border-[#E5E7EB] flex items-center justify-between text-xs text-[#4B5563]">
                    <span>
                      {trimmedQuery
                        ? `${instantResults.length} matching review${instantResults.length === 1 ? '' : 's'} for "${trimmedQuery}"`
                        : selectedCategory === 'all'
                          ? `All ${instantResults.length} Flagship Reviews`
                          : `${getCategoryBySlug(selectedCategory)?.name ?? ''} Reviews`}
                    </span>
                    <button
                      type="button"
                      onClick={() => setIsDropdownOpen(false)}
                      className="text-[#4B5563] hover:text-[#111827] font-medium cursor-pointer"
                    >
                      Close
                    </button>
                  </div>

                  {instantResults.length === 0 ? (
                    <div className="px-4 py-6 text-center">
                      <p className="text-sm font-medium text-[#111827]">
                        No tested reviews matched &ldquo;{trimmedQuery}&rdquo;
                      </p>
                      <p className="text-xs text-[#4B5563] mt-1">
                        Try searching by product type like &ldquo;air fryer&rdquo;, &ldquo;lamp&rdquo;, &ldquo;drill&rdquo;, or &ldquo;hose timer&rdquo;.
                      </p>
                    </div>
                  ) : (
                    <ul className="divide-y divide-[#F3F4F6] max-h-[360px] overflow-y-auto">
                      {instantResults.map((review) => {
                        const cat = getCategoryBySlug(review.categorySlug);
                        return (
                          <li key={review.slug}>
                            <button
                              type="button"
                              onClick={() => handleSelectResult(review.slug)}
                              className="w-full px-3.5 py-2.5 flex items-center gap-3 text-left hover:bg-[#F9FAFB] transition-colors cursor-pointer"
                            >
                              <img
                                src={resolveAssetUrl(review.image)}
                                alt={review.productName}
                                width={56}
                                height={42}
                                referrerPolicy="no-referrer"
                                className="w-14 h-11 object-contain bg-white border border-[#E5E7EB] rounded p-0.5 shrink-0"
                              />
                              <div className="min-w-0 flex-1">
                                <p className="text-sm font-semibold text-[#111827] truncate">
                                  {review.productName}
                                </p>
                                <div className="flex flex-wrap items-center gap-x-2 gap-y-0.5 mt-0.5 text-xs text-[#4B5563]">
                                  <span>{cat?.name}</span>
                                  <span aria-hidden="true">·</span>
                                  <StarRating rating={review.rating} size="sm" />
                                  <span aria-hidden="true">·</span>
                                  <span>{review.priceTier}</span>
                                </div>
                              </div>
                              <ArrowRight className="w-4 h-4 text-[#9CA3AF] shrink-0" aria-hidden="true" />
                            </button>
                          </li>
                        );
                      })}
                    </ul>
                  )}
                </div>
              )}
            </div>

            {/* Right Quick Navigation Links */}
            <nav
              aria-label="Primary site links"
              className="order-2 md:order-3 flex items-center gap-4 sm:gap-5 text-[13px] font-medium text-[#E5E7EB] shrink-0"
            >
              <Link
                to="/#featured-reviews"
                onClick={(e) => {
                  if (activePath !== '/') {
                    e.preventDefault();
                    navigateTo('/');
                    setTimeout(() => {
                      document.getElementById('featured-reviews')?.scrollIntoView({ behavior: 'smooth' });
                    }, 80);
                  }
                }}
                className="hover:text-[#F59E0B] transition-colors whitespace-nowrap shrink-0"
              >
                Reviews
              </Link>
              <Link
                to="/how-we-review"
                className={`hover:text-[#F59E0B] transition-colors whitespace-nowrap shrink-0 ${
                  activePath === '/how-we-review' ? 'text-[#F59E0B]' : ''
                }`}
              >
                How We Review
              </Link>
              <Link
                to="/about"
                className={`hover:text-[#F59E0B] transition-colors whitespace-nowrap shrink-0 ${
                  activePath === '/about' ? 'text-[#F59E0B]' : ''
                }`}
              >
                About
              </Link>
            </nav>
          </div>
        </div>

        {/* Secondary Department Nav Bar (#232F3E) */}
        <nav
          aria-label="Product departments"
          className="bg-[#232F3E] text-[#F3F4F6] border-t border-white/10"
        >
          <div className="max-w-[1360px] mx-auto px-4 sm:px-6 flex items-center gap-1 sm:gap-2 overflow-x-auto no-scrollbar py-1.5">
            <span className="hidden lg:inline-block text-xs font-semibold text-[#9CA3AF] pr-2 whitespace-nowrap shrink-0">
              Departments:
            </span>
            {CATEGORIES.map((category) => {
              const target = `/category/${category.slug}`;
              const isActive = activePath === target;
              return (
                <Link
                  key={category.slug}
                  to={target}
                  className={`px-3 py-1.5 text-[13px] font-medium rounded whitespace-nowrap shrink-0 transition-colors ${
                    isActive
                      ? 'bg-white/15 text-[#F59E0B]'
                      : 'text-[#E5E7EB] hover:bg-white/10 hover:text-white'
                  }`}
                >
                  {category.name}
                </Link>
              );
            })}
          </div>
        </nav>
      </header>

      {/* Clean Independent Affiliate Disclosure Banner (omitted on /review/* where ReviewPage places it right above the Buy Box) */}
      {!activePath.startsWith('/review/') && (
        <div className="bg-white border-b border-[#E5E7EB]">
          <div className="max-w-[1360px] mx-auto px-4 sm:px-6 py-2 flex items-center justify-center gap-2 text-center">
            <ShieldCheck className="w-3.5 h-3.5 text-[#D97706] shrink-0 hidden sm:inline" aria-hidden="true" />
            <p className="text-[12px] leading-snug text-[#4B5563]">
              <strong className="font-semibold text-[#111827]">Independent Review Site</strong> — Shoppingey.com is not Amazon. As an Amazon Associate, I earn from qualifying purchases at no extra cost to you.{' '}
              <Link
                to="/affiliate-disclosure"
                className="underline text-[#111827] hover:text-[#D97706] whitespace-nowrap"
              >
                Read disclosure
              </Link>
            </p>
          </div>
        </div>
      )}
    </>
  );
};
