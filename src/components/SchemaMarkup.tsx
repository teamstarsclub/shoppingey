import { useEffect } from 'react';

export interface SchemaMarkupProps {
  id: string;
  schemas: Record<string, unknown>[];
}

/**
 * Injects clean, valid JSON-LD structured data into <head> for Google Rich Results
 * (Product, Review, positiveNotes/negativeNotes, FAQPage, BreadcrumbList, CollectionPage, Organization, WebSite).
 */
export function SchemaMarkup({ id, schemas }: SchemaMarkupProps) {
  const serialized = JSON.stringify(schemas);

  useEffect(() => {
    // Remove any static pre-rendered JSON-LD nodes for this group (and stale route groups) to prevent duplicates
    const selector =
      id === 'sitewide'
        ? 'script[data-prerendered-schema="sitewide"]'
        : 'script[data-prerendered-schema]:not([data-prerendered-schema="sitewide"])';
    document.head
      .querySelectorAll<HTMLScriptElement>(selector)
      .forEach((node) => node.parentNode?.removeChild(node));

    const parsed: Record<string, unknown>[] = JSON.parse(serialized);
    const createdNodes: HTMLScriptElement[] = [];

    parsed.forEach((schema, idx) => {
      const script = document.createElement('script');
      script.type = 'application/ld+json';
      script.dataset.schemaGroup = id;
      script.dataset.schemaIndex = String(idx);
      script.textContent = JSON.stringify(schema);
      document.head.appendChild(script);
      createdNodes.push(script);
    });

    return () => {
      createdNodes.forEach((node) => {
        if (node.parentNode) {
          node.parentNode.removeChild(node);
        }
      });
    };
  }, [id, serialized]);

  return null;
}
