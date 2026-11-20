import React from 'react';
import { ArrowUp } from 'lucide-react';
import { CATEGORIES, REVIEWS, SITE_CONFIG } from '../data/reviews';
import { Link } from './Link';

export const Footer: React.FC = () => {
  const scrollToTop = () => {
    window.scrollTo({ top: 0, behavior: 'smooth' });
  };

  return (
    <footer className="mt-16 text-[#E5E7EB]">
      {/* Amazon-Inspired Back to Top Bar */}
      <button
        type="button"
        onClick={scrollToTop}
        className="w-full bg-[#37475A] hover:bg-[#485769] text-white text-[13px] font-medium py-3 flex items-center justify-center gap-2 transition-colors cursor-pointer"
      >
        <ArrowUp className="w-4 h-4" aria-hidden="true" />
        <span>Back to top</span>
      </button>

      {/* Main Multi-Column Navigation */}
      <div className="bg-[#232F3E] border-b border-white/10">
        <div className="max-w-[1360px] mx-auto px-4 sm:px-6 py-12 grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-8 lg:gap-10">
          {/* Column 1: Brand Summary */}
          <div>
            <Link to="/" className="inline-flex items-center gap-2 text-lg font-bold text-white">
              <span className="inline-flex items-center justify-center w-7 h-7 rounded bg-[#F59E0B] text-[#131921] font-extrabold text-sm">
                S
              </span>
              <span>
                Shoppingey<span className="text-[#F59E0B]">.com</span>
              </span>
            </Link>
            <p className="mt-3 text-[13px] leading-relaxed text-[#D1D5DB]">
              Independent, hands-on product reviews and department buying guides designed to help
              shoppers cut through marketplace noise and choose dependable gear on Amazon.
            </p>
            <p className="mt-3 text-xs text-[#9CA3AF]">
              Editorial inquiries:{' '}
              <a
                href={`mailto:${SITE_CONFIG.contactEmail}`}
                className="text-[#F59E0B] hover:underline"
              >
                {SITE_CONFIG.contactEmail}
              </a>
            </p>
          </div>

          {/* Column 2: All 5 Departments */}
          <div>
            <h2 className="text-sm font-bold text-white tracking-tight mb-3.5">
              Shop by Department
            </h2>
            <ul className="space-y-2 text-[13px]">
              {CATEGORIES.map((category) => (
                <li key={category.slug}>
                  <Link
                    to={`/category/${category.slug}`}
                    className="text-[#D1D5DB] hover:text-[#F59E0B] hover:underline transition-colors"
                  >
                    {category.name}
                  </Link>
                </li>
              ))}
            </ul>
          </div>

          {/* Column 3: Latest Flagship Reviews */}
          <div>
            <h2 className="text-sm font-bold text-white tracking-tight mb-3.5">
              Featured Reviews
            </h2>
            <ul className="space-y-2 text-[13px]">
              {REVIEWS.map((review) => (
                <li key={review.slug}>
                  <Link
                    to={`/review/${review.slug}`}
                    className="text-[#D1D5DB] hover:text-[#F59E0B] hover:underline transition-colors line-clamp-1"
                  >
                    {review.productName}
                  </Link>
                </li>
              ))}
            </ul>
          </div>

          {/* Column 4: Editorial Standards & Legal Compliance */}
          <div>
            <h2 className="text-sm font-bold text-white tracking-tight mb-3.5">
              Trust &amp; Policies
            </h2>
            <ul className="space-y-2 text-[13px]">
              <li>
                <Link
                  to="/about"
                  className="text-[#D1D5DB] hover:text-[#F59E0B] hover:underline transition-colors"
                >
                  About Shoppingey.com
                </Link>
              </li>
              <li>
                <Link
                  to="/how-we-review"
                  className="text-[#D1D5DB] hover:text-[#F59E0B] hover:underline transition-colors"
                >
                  How We Review Products
                </Link>
              </li>
              <li>
                <Link
                  to="/affiliate-disclosure"
                  className="text-[#D1D5DB] hover:text-[#F59E0B] hover:underline transition-colors"
                >
                  Affiliate Disclosure
                </Link>
              </li>
              <li>
                <Link
                  to="/privacy-policy"
                  className="text-[#D1D5DB] hover:text-[#F59E0B] hover:underline transition-colors"
                >
                  Privacy Policy
                </Link>
              </li>
              <li>
                <Link
                  to="/terms"
                  className="text-[#D1D5DB] hover:text-[#F59E0B] hover:underline transition-colors"
                >
                  Terms of Use
                </Link>
              </li>
              <li>
                <Link
                  to="/contact"
                  className="text-[#D1D5DB] hover:text-[#F59E0B] hover:underline transition-colors"
                >
                  Contact Editorial Team
                </Link>
              </li>
            </ul>
          </div>
        </div>
      </div>

      {/* Bottom Legal & Amazon Associates Non-Affiliation Disclaimer (#131921) */}
      <div className="bg-[#131921] text-[#9CA3AF]">
        <div className="max-w-[1360px] mx-auto px-4 sm:px-6 py-6 space-y-3 text-center">
          <p className="text-xs leading-relaxed max-w-4xl mx-auto">
            <strong className="text-[#E5E7EB]">Amazon Associates &amp; Non-Affiliation Disclaimer:</strong>{' '}
            As an Amazon Associate, I earn from qualifying purchases. Shoppingey.com is an
            independent product review publication and is not owned by, operated by, or affiliated
            with Amazon.com, Inc. Amazon and the Amazon logo are trademarks of Amazon.com, Inc. or
            its affiliates. Product availability and live prices are accurate as of the time shown
            on Amazon and are subject to change without notice.
          </p>
          <p className="text-xs text-[#6B7280]">
            &copy; {new Date().getFullYear()} Shoppingey.com. All rights reserved.
          </p>
        </div>
      </div>
    </footer>
  );
};
