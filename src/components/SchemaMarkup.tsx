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
