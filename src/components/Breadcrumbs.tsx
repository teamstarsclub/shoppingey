import React from 'react';
import { ChevronRight, Home } from 'lucide-react';
import type { BreadcrumbItem } from '../utils/catalog';
import { Link } from './Link';

export interface BreadcrumbsProps {
  items: BreadcrumbItem[];
  className?: string;
}

export const Breadcrumbs: React.FC<BreadcrumbsProps> = ({ items, className = 'mb-5' }) => {
  if (items.length === 0) return null;

  return (
    <nav aria-label="Breadcrumb" className={className}>
      <ol
        itemScope
        itemType="https://schema.org/BreadcrumbList"
        className="flex items-center flex-wrap gap-1.5 px-3.5 py-2 bg-white border border-[#E5E7EB] rounded-md text-xs text-[#4B5563]"
      >
        {items.map((item, idx) => {
          const isFirst = idx === 0;
          const isLast = idx === items.length - 1;

          return (
            <React.Fragment key={`${item.path}-${idx}`}>
              {!isFirst && (
                <li aria-hidden="true" className="flex items-center text-[#9CA3AF]">
                  <ChevronRight className="w-3.5 h-3.5" strokeWidth={2.2} />
                </li>
              )}
              <li
                itemProp="itemListElement"
                itemScope
                itemType="https://schema.org/ListItem"
                aria-current={isLast ? 'page' : undefined}
                className={`inline-flex items-center min-w-0 ${
                  isLast ? 'font-semibold text-[#111827]' : ''
                }`}
              >
                {isLast ? (
                  <span itemProp="name" className="truncate max-w-[260px] sm:max-w-none">
                    {item.name}
                  </span>
                ) : (
                  <Link
                    to={item.path}
                    itemProp="item"
                    className="inline-flex items-center gap-1 hover:text-[#B45309] hover:underline transition-colors whitespace-nowrap"
                  >
                    {isFirst && (
                      <Home className="w-3.5 h-3.5 text-[#6B7280] shrink-0" aria-hidden="true" />
                    )}
                    <span itemProp="name">{item.name}</span>
                  </Link>
                )}
                <meta itemProp="position" content={String(idx + 1)} />
              </li>
            </React.Fragment>
          );
        })}
      </ol>
    </nav>
  );
};
