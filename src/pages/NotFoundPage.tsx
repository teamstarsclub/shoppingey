import React from 'react';
import { ArrowRight } from 'lucide-react';
import { CATEGORIES } from '../data/reviews';
import { Link } from '../components/Link';
import { SEOHead } from '../components/SEOHead';

export interface NotFoundPageProps {
  path: string;
}

export const NotFoundPage: React.FC<NotFoundPageProps> = ({ path }) => {
  return (
    <>
      <SEOHead
        title="Page Not Found | Shoppingey.com"
        description="The requested Shoppingey.com page could not be found. Browse our five independent Amazon product review departments."
        canonicalPath={path}
        robots="noindex, nofollow"
      />
      <div className="max-w-[760px] mx-auto px-4 sm:px-6 py-16 text-center">
        <div className="bg-white border border-[#E5E7EB] rounded-lg p-8 sm:p-12">
          <p className="font-mono text-xs font-semibold text-[#B45309]">404 · Page Not Found</p>
          <h1 className="mt-2 text-2xl sm:text-3xl font-extrabold text-[#111827]">
            We couldn’t find that page
          </h1>
          <p className="mt-2 text-sm text-[#4B5563]">
            The review or department URL <code className="font-mono text-xs">{path}</code> may have
            moved. Jump back to our storefront or choose a department below.
          </p>

          <div className="mt-6">
            <Link
              to="/"
              className="inline-flex items-center gap-1.5 px-5 py-2.5 text-sm font-semibold text-[#131921] bg-[#F59E0B] hover:bg-[#D97706] rounded-md transition-colors"
            >
              <span>Return to Shoppingey.com Home</span>
              <ArrowRight className="w-4 h-4" aria-hidden="true" />
            </Link>
          </div>

          <div className="mt-8 pt-6 border-t border-[#F3F4F6] flex flex-wrap items-center justify-center gap-3 text-xs font-medium">
            {CATEGORIES.map((cat) => (
              <Link
                key={cat.slug}
                to={`/category/${cat.slug}`}
                className="px-3 py-1.5 bg-[#F3F4F6] hover:bg-[#E5E7EB] text-[#111827] rounded transition-colors"
              >
                {cat.name}
              </Link>
            ))}
          </div>
        </div>
      </div>
    </>
  );
};
